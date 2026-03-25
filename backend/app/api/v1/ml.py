"""
ThreatMatrix AI — ML API Endpoints

Per MASTER_DOC_PART2 §5.1: ML model management and inference endpoints.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/ml", tags=["ML Models"])
logger = logging.getLogger(__name__)

EVAL_DIR = Path(__file__).parent.parent.parent.parent / "ml" / "saved_models" / "eval_results"
MODELS_DIR = Path(__file__).parent.parent.parent.parent / "ml" / "saved_models"


@router.get("/models")
async def list_models() -> Dict[str, Any]:
    """List all ML models and their status."""
    models = []

    for name in ["isolation_forest", "random_forest", "autoencoder"]:
        model_info: Dict[str, Any] = {
            "name": name,
            "trained": False,
            "eval_results": None,
        }

        # Check if model exists
        if name == "autoencoder":
            model_info["trained"] = (MODELS_DIR / name / "model.keras").exists()
        else:
            model_info["trained"] = (MODELS_DIR / f"{name}.pkl").exists()

        # Load eval results if available
        eval_path = EVAL_DIR / f"{name}_eval.json"
        if eval_path.exists():
            with open(eval_path) as f:
                model_info["eval_results"] = json.load(f)

        models.append(model_info)

    return {"models": models, "count": len(models)}


@router.get("/comparison")
async def compare_models() -> Dict[str, Any]:
    """Compare all trained models' performance metrics."""
    results = []

    for name in ["isolation_forest", "random_forest", "autoencoder", "ensemble"]:
        eval_path = EVAL_DIR / f"{name}_eval.json"
        if eval_path.exists():
            with open(eval_path) as f:
                results.append(json.load(f))

    if not results:
        raise HTTPException(status_code=404, detail="No evaluation results found. Train models first.")

    # Find best model
    best_acc = max(results, key=lambda r: r.get("accuracy", 0))
    best_f1 = max(results, key=lambda r: r.get("f1_score", r.get("f1_weighted", 0)))

    return {
        "models": results,
        "best_accuracy": best_acc["model"],
        "best_f1": best_f1["model"],
    }


class PredictRequest(BaseModel):
    """Request body for ML prediction."""
    features: Dict[str, Any]


class PredictResponse(BaseModel):
    """Response from ML prediction."""
    composite_score: float
    severity: str
    is_anomaly: bool
    label: str
    model_agreement: str
    scores: Dict[str, float]


@router.post("/predict", response_model=PredictResponse)
async def predict_flow(request: PredictRequest) -> PredictResponse:
    """Score a flow with the ML ensemble."""
    import numpy as np
    from ml.inference.preprocessor import FlowPreprocessor
    from ml.inference.model_manager import ModelManager

    preprocessor = FlowPreprocessor()
    preprocessor.load()

    manager = ModelManager()
    manager.load_all()

    X = preprocessor.preprocess_flow(request.features)
    if X is None:
        raise HTTPException(status_code=400, detail="Failed to preprocess features")

    results = manager.score_flows(X.reshape(1, -1))
    if not results:
        raise HTTPException(status_code=500, detail="Scoring failed")

    r = results[0]
    return PredictResponse(
        composite_score=r["composite_score"],
        severity=r["severity"],
        is_anomaly=r["is_anomaly"],
        label=r["label"],
        model_agreement=r["model_agreement"],
        scores={
            "isolation_forest": r["if_score"],
            "autoencoder": r["ae_score"],
            "random_forest_confidence": r["rf_confidence"],
        },
    )


# ── Retrain Endpoint (per MASTER_DOC_PART2 §5.1) ──────────────────


class RetrainRequest(BaseModel):
    """Request body for model retraining trigger."""
    dataset: str = "nsl_kdd"
    models: List[str] = [
        "isolation_forest",
        "random_forest",
        "autoencoder",
    ]


class RetrainResponse(BaseModel):
    """Response from retrain trigger."""
    status: str
    task_id: str
    message: str


# In-memory retrain task tracking (sufficient for single-worker deployment)
_retrain_tasks: Dict[str, Dict[str, Any]] = {}


@router.post("/retrain", response_model=RetrainResponse)
async def retrain_models(request: RetrainRequest) -> RetrainResponse:
    """
    Trigger model retraining as a background subprocess.

    Per MASTER_DOC_PART2 §5.1: POST /ml/retrain
    Admin-only endpoint. Launches training in a background subprocess
    to avoid blocking the ML Worker inference pipeline.

    Args:
        request: RetrainRequest with dataset and models list.

    Returns:
        RetrainResponse with task_id for tracking.
    """
    task_id = uuid.uuid4().hex[:8]

    # Validate requested models
    valid_models = {"isolation_forest", "random_forest", "autoencoder"}
    invalid = set(request.models) - valid_models
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model(s): {invalid}. Valid: {valid_models}",
        )

    # Launch background retraining task
    _retrain_tasks[task_id] = {
        "status": "started",
        "dataset": request.dataset,
        "models": request.models,
    }
    asyncio.create_task(_run_retraining(task_id, request.dataset))

    logger.info(
        "[ML] Retrain triggered: task=%s, dataset=%s, models=%s",
        task_id,
        request.dataset,
        request.models,
    )

    return RetrainResponse(
        status="started",
        task_id=task_id,
        message=f"Retraining {len(request.models)} model(s) on {request.dataset} dataset",
    )


@router.get("/retrain/{task_id}")
async def get_retrain_status(task_id: str) -> Dict[str, Any]:
    """
    Check the status of a retraining task.

    Args:
        task_id: Task ID returned from POST /ml/retrain.

    Returns:
        Task status dict.
    """
    task = _retrain_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return {"task_id": task_id, **task}


async def _run_retraining(task_id: str, dataset: str) -> None:
    """
    Execute model retraining in a background subprocess.

    Uses python -m ml.training.train_all to retrain all models.
    Does NOT block the ML Worker or API server.

    Args:
        task_id: Unique task identifier.
        dataset: Dataset name (e.g., 'nsl_kdd').
    """
    logger.info("[ML] Retrain started: task=%s, dataset=%s", task_id, dataset)
    _retrain_tasks[task_id]["status"] = "running"

    try:
        proc = await asyncio.create_subprocess_exec(
            "python", "-m", "ml.training.train_all",
            "--dataset", dataset,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            _retrain_tasks[task_id]["status"] = "completed"
            logger.info("[ML] Retrain complete: task=%s", task_id)
        else:
            _retrain_tasks[task_id]["status"] = "failed"
            stderr_text = stderr.decode()[:500] if stderr else "unknown"
            _retrain_tasks[task_id]["error"] = stderr_text
            logger.error(
                "[ML] Retrain failed: task=%s, stderr=%s",
                task_id,
                stderr_text,
            )
    except Exception as exc:
        _retrain_tasks[task_id]["status"] = "failed"
        _retrain_tasks[task_id]["error"] = str(exc)
        logger.error("[ML] Retrain exception: task=%s, error=%s", task_id, exc)
