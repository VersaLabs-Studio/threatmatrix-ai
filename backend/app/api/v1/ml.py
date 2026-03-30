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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import require_role
from app.models.user import User
from app.services.audit_service import log_audit_event_sync

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
async def retrain_models(
    request: RetrainRequest,
    current_user: User = Depends(require_role(["admin"])),
) -> RetrainResponse:
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

    # Audit log (fire-and-forget)
    log_audit_event_sync(
        action="model_retrain",
        entity_type="model",
        entity_id=task_id,
        user_id=str(current_user.id),
        details={"dataset": request.dataset, "models": request.models},
    )

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


# ── ML Ops Endpoints (per MASTER_DOC_PART3 §9.1) ──────────────


@router.get("/models/{model_type}/confusion-matrix")
async def get_confusion_matrix(model_type: str) -> Dict[str, Any]:
    """
    Get confusion matrix for a specific model.

    Per MASTER_DOC_PART3 §9.1 (Confusion Matrix component).
    Reads from evaluation results JSON files.

    Args:
        model_type: One of isolation_forest, random_forest, autoencoder, ensemble.
    """
    valid = {"isolation_forest", "random_forest", "autoencoder", "ensemble"}
    if model_type not in valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model type: {model_type}. Valid: {sorted(valid)}",
        )

    eval_path = EVAL_DIR / f"{model_type}_eval.json"
    if not eval_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No evaluation results found for {model_type}",
        )

    with open(eval_path) as f:
        eval_data = json.load(f)

    # Derive class names from classification_report keys or defaults
    class_names = eval_data.get("class_names", [])
    if not class_names and "classification_report" in eval_data:
        class_names = [
            k
            for k in eval_data["classification_report"]
            if k not in ("accuracy", "macro avg", "weighted avg", "micro avg")
        ]
    if not class_names:
        class_names = ["normal", "anomaly"]

    return {
        "model": model_type,
        "confusion_matrix": eval_data.get("confusion_matrix", []),
        "class_names": class_names,
        "n_samples": eval_data.get("n_samples", 0),
    }


@router.get("/models/{model_type}/feature-importance")
async def get_feature_importance(model_type: str) -> Dict[str, Any]:
    """
    Get feature importance for a tree-based model.

    Per MASTER_DOC_PART3 §9.1 (Feature Importance component).
    Only available for tree-based models: isolation_forest, random_forest.

    Loads the pickled model and extracts feature_importances_.
    Returns top 30 features ranked by importance (descending).

    Args:
        model_type: One of isolation_forest, random_forest.
    """
    if model_type not in {"isolation_forest", "random_forest"}:
        raise HTTPException(
            status_code=400,
            detail="Feature importance only available for tree-based models "
            "(isolation_forest, random_forest)",
        )

    try:
        import joblib
    except ImportError:
        raise HTTPException(status_code=500, detail="joblib not available")

    model_path = MODELS_DIR / f"{model_type}.pkl"
    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Model file not found: {model_type}",
        )

    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load model: {e}"
        )

    importances = getattr(model, "feature_importances_", None)
    if importances is None:
        return {
            "model": model_type,
            "feature_importance": [],
            "n_features": 0,
            "note": "Model does not expose feature_importances_ attribute",
        }

    # Attempt to load feature names from the preprocessor scaler
    feature_names: List[str] = []
    try:
        scaler_path = MODELS_DIR / "preprocessor_scaler.pkl"
        if scaler_path.exists():
            scaler = joblib.load(scaler_path)
            if hasattr(scaler, "feature_names_in_"):
                feature_names = list(scaler.feature_names_in_)
    except Exception:
        pass

    # Fallback to generic names
    if not feature_names:
        feature_names = [f"feature_{i}" for i in range(len(importances))]

    # Sort by importance descending, return top 30
    import numpy as np
    indices = np.argsort(importances)[::-1]
    ranked = [
        {
            "feature": feature_names[i] if i < len(feature_names) else f"feature_{i}",
            "importance": round(float(importances[i]), 6),
            "rank": rank + 1,
        }
        for rank, i in enumerate(indices[:30])
    ]

    return {
        "model": model_type,
        "feature_importance": ranked,
        "n_features": len(importances),
    }


@router.get("/training-history")
async def get_training_history() -> Dict[str, Any]:
    """
    Get training history from the ml_models registry.

    Per MASTER_DOC_PART3 §9.1 (Training History component).
    Returns model entries from the ml_models table with metrics
    and hyperparameters.
    """
    from app.database import async_session
    from sqlalchemy import text

    async with async_session() as session:
        result = await session.execute(
            text(
                """
                SELECT name, model_type, version, status, dataset,
                       metrics, hyperparams, training_time, inference_time,
                       is_active, trained_at, created_at
                FROM ml_models
                ORDER BY created_at DESC
                LIMIT 50
                """
            )
        )
        rows = result.fetchall()

    history = []
    for r in rows:
        # Handle metrics — may be dict (from JSONB) or string (from JSON)
        metrics = r[5]
        if isinstance(metrics, str):
            try:
                metrics = json.loads(metrics)
            except (json.JSONDecodeError, TypeError):
                metrics = {}
        elif not isinstance(metrics, dict):
            metrics = {}

        # Handle hyperparams similarly
        hyperparams = r[6]
        if isinstance(hyperparams, str):
            try:
                hyperparams = json.loads(hyperparams)
            except (json.JSONDecodeError, TypeError):
                hyperparams = {}
        elif not isinstance(hyperparams, dict):
            hyperparams = {}

        history.append(
            {
                "name": r[0],
                "model_type": r[1],
                "version": r[2],
                "status": r[3],
                "dataset": r[4],
                "metrics": metrics,
                "hyperparams": hyperparams,
                "training_time": r[7],
                "inference_time": r[8],
                "is_active": r[9],
                "trained_at": str(r[10]) if r[10] else None,
                "created_at": str(r[11]) if r[11] else None,
            }
        )

    return {"history": history, "total": len(history)}
