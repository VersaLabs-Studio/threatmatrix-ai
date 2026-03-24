"""
ThreatMatrix AI — ML API Endpoints

Per MASTER_DOC_PART2 §5.1: ML model management and inference endpoints.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

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
