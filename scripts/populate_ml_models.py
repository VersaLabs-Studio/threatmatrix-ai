"""
ThreatMatrix AI — Populate ML Models Registry

Per MASTER_DOC_PART3 §9.1 (Model Registry):
  Insert current model metadata into the ml_models table for the
  ML Ops dashboard.

This script can be run:
  - Directly: python scripts/populate_ml_models.py
  - In Docker: docker compose exec backend python /app/scripts/populate_ml_models.py
  - On startup: called from main.py lifespan

Uses ON CONFLICT DO UPDATE to handle re-runs safely.
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

# Ensure backend/ is on sys.path when running directly
_backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from sqlalchemy import text
from app.database import async_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model file paths (inside Docker: /app/ml/saved_models/)
MODELS_DIR = Path("/app/ml/saved_models")
EVAL_DIR = MODELS_DIR / "eval_results"


# ── Model Definitions ─────────────────────────────────────────

MODEL_DEFINITIONS = [
    {
        "name": "isolation_forest_v1",
        "model_type": "isolation_forest",
        "version": "1.1",
        "status": "active",
        "dataset": "nsl_kdd",
        "file_path": "ml/saved_models/isolation_forest.pkl",
        "eval_file": "isolation_forest_eval.json",
        "param_key": "isolation_forest",
    },
    {
        "name": "random_forest_v1",
        "model_type": "random_forest",
        "version": "1.0",
        "status": "active",
        "dataset": "nsl_kdd",
        "file_path": "ml/saved_models/random_forest.pkl",
        "eval_file": "random_forest_eval.json",
        "param_key": "random_forest",
    },
    {
        "name": "autoencoder_v1",
        "model_type": "autoencoder",
        "version": "1.0",
        "status": "active",
        "dataset": "nsl_kdd",
        "file_path": "ml/saved_models/autoencoder/model.keras",
        "eval_file": "autoencoder_eval.json",
        "param_key": "autoencoder",
    },
]


def _load_json(path: Path) -> dict:
    """Load a JSON file, returning empty dict if not found."""
    try:
        if path.exists():
            with open(path) as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.warning("Failed to load %s: %s", path, e)
    return {}


def _extract_metrics(eval_data: dict) -> dict:
    """Extract key metrics from evaluation results JSON."""
    return {
        "accuracy": eval_data.get("accuracy", 0),
        "f1_score": eval_data.get("f1_score", eval_data.get("f1_weighted", 0)),
        "precision": eval_data.get("precision", 0),
        "recall": eval_data.get("recall", 0),
        "auc_roc": eval_data.get("auc_roc", eval_data.get("auc", 0)),
        "model": eval_data.get("model", ""),
    }


async def populate_ml_models() -> int:
    """
    Insert or update model registry entries.

    Returns:
        Number of models inserted/updated.
    """
    # Load best_params.json for hyperparameters
    best_params = _load_json(MODELS_DIR / "best_params.json")

    count = 0
    now = datetime.now(timezone.utc)

    async with async_session() as session:
        for m in MODEL_DEFINITIONS:
            # Load eval results
            eval_data = _load_json(EVAL_DIR / m["eval_file"])
            metrics = _extract_metrics(eval_data)

            # Load hyperparams for this model type
            hyperparams = best_params.get(m["param_key"], {})

            # Get model file size (if exists)
            model_path = MODELS_DIR / m["file_path"].replace("ml/saved_models/", "")
            file_size = model_path.stat().st_size if model_path.exists() else 0

            model_id = str(uuid4())

            await session.execute(
                text(
                    """
                    INSERT INTO ml_models (
                        id, name, model_type, version, status, dataset,
                        metrics, hyperparams, file_path, is_active,
                        trained_at, created_at, updated_at
                    ) VALUES (
                        :id, :name, :model_type, :version, :status, :dataset,
                        :metrics, :hyperparams, :file_path, true,
                        :trained_at, :now, :now
                    )
                    ON CONFLICT (name) DO UPDATE SET
                        version = EXCLUDED.version,
                        status = EXCLUDED.status,
                        metrics = EXCLUDED.metrics,
                        hyperparams = EXCLUDED.hyperparams,
                        file_path = EXCLUDED.file_path,
                        is_active = EXCLUDED.is_active,
                        updated_at = CURRENT_TIMESTAMP
                    """
                ),
                {
                    "id": model_id,
                    "name": m["name"],
                    "model_type": m["model_type"],
                    "version": m["version"],
                    "status": m["status"],
                    "dataset": m["dataset"],
                    "metrics": json.dumps(metrics),
                    "hyperparams": json.dumps(hyperparams),
                    "file_path": m["file_path"],
                    "trained_at": now,
                    "now": now,
                },
            )

            count += 1
            logger.info(
                "  %s (%s) — metrics=%s, hyperparams=%s",
                m["name"],
                m["model_type"],
                "loaded" if eval_data else "no eval file",
                "loaded" if hyperparams else "no params",
            )

        await session.commit()

    logger.info("ML Models registry populated: %d entries", count)
    return count


async def main() -> None:
    """Entry point for standalone execution."""
    logger.info("=" * 50)
    logger.info("Populating ml_models table...")
    logger.info("=" * 50)

    try:
        count = await populate_ml_models()
        logger.info("Done — %d model(s) registered.", count)
    except Exception as e:
        logger.error("Failed: %s", e, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
