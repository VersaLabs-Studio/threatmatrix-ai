"""
ThreatMatrix AI — CICIDS2017 Validation Runner

One-shot script that runs cross-dataset validation against CICIDS2017.
Designed to run in a dedicated Docker container (not the live backend).

Usage:
  docker compose --profile validate run --rm cicids-validate
  python scripts/run_cicids_validation.py [--csv-dir PATH]
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cicids2017_validation")

# Ensure backend/ and ml/ are on sys.path
# In Docker container: /app contains backend code directly
# On host: parent.parent/backend contains backend code
_script_path = Path(__file__).resolve()
_backend_dir = _script_path.parent.parent / "backend"
if not _backend_dir.exists():
    # Running inside Docker container - code is at /app
    _backend_dir = Path("/app")
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run CICIDS2017 cross-dataset validation"
    )
    parser.add_argument(
        "--csv-dir",
        type=str,
        default="/app/ml/saved_models/datasets/cicids2017",
        help="Directory containing CICIDS2017 CSV files",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output path for results JSON (default: eval_results/)",
    )
    args = parser.parse_args()

    csv_dir = Path(args.csv_dir)
    if not csv_dir.exists():
        logger.error("CSV directory not found: %s", csv_dir)
        logger.error("Run download_cicids2017.sh first")
        sys.exit(1)

    csv_count = len(list(csv_dir.glob("*.csv")))
    if csv_count == 0:
        logger.error("No CSV files in %s", csv_dir)
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("CICIDS2017 CROSS-DATASET VALIDATION")
    logger.info("=" * 60)
    logger.info("CSV directory: %s (%d files)", csv_dir, csv_count)

    start = time.time()

    try:
        from ml.datasets.cicids2017 import validate_ensemble_on_cicids2017

        output_path = Path(args.output) if args.output else None
        results = validate_ensemble_on_cicids2017(
            csv_dir=str(csv_dir),
            output_path=output_path,
        )

        elapsed = time.time() - start

        logger.info("")
        logger.info("=" * 60)
        logger.info("VALIDATION RESULTS")
        logger.info("=" * 60)
        logger.info("Dataset: CICIDS2017")
        logger.info("Samples: %s", f"{results.get('n_samples', 'N/A'):,}")
        logger.info("Features: %s", results.get("n_features", "N/A"))
        logger.info("Classes: %s", results.get("class_names", []))
        logger.info("")
        logger.info("Label distribution:")
        for label, count in results.get("label_distribution", {}).items():
            logger.info("  %-20s %s", label, f"{count:,}")
        logger.info("")

        ensemble = results.get("ensemble", {})
        if "error" in ensemble:
            logger.error("Ensemble evaluation FAILED: %s", ensemble["error"])
        else:
            logger.info("Ensemble Performance:")
            logger.info("  Accuracy:  %.4f", ensemble.get("accuracy", 0))
            logger.info("  Precision: %.4f", ensemble.get("precision", 0))
            logger.info("  Recall:    %.4f", ensemble.get("recall", 0))
            logger.info("  F1-Score:  %.4f", ensemble.get("f1_score", 0))
            logger.info("  AUC-ROC:   %.4f", ensemble.get("auc_roc", 0))
        logger.info("")
        logger.info("Completed in %.1f seconds", elapsed)

    except Exception as e:
        logger.error("Validation failed: %s", e, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
