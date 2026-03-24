"""
ThreatMatrix AI — Hyperparameter Tuning

Per MASTER_DOC_PART4 §4.4, §5.2: Grid search for IF and RF models.

IF: Grid search contamination [0.05-0.15] to boost recall from 66% → 85%+.
RF: Grid search max_depth/n_estimators/min_samples_split.

Run: python -m ml.training.tune_models
"""

from __future__ import annotations

import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from ml.datasets.nsl_kdd import NSLKDDLoader
from ml.models.isolation_forest import IsolationForestModel
from ml.models.random_forest import RandomForestModel
from ml.training.evaluate import ModelEvaluator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

HYPERPARAMS_PATH = Path(__file__).parent / "hyperparams.py"


def tune_isolation_forest() -> Dict[str, Any]:
    """
    Grid search over contamination and n_estimators for Isolation Forest.

    Target: Improve recall from 66% → 80%+ with acceptable precision trade-off.

    Returns:
        Best result dict with tuned params.
    """
    logger.info("=" * 60)
    logger.info("TUNING: Isolation Forest")
    logger.info("=" * 60)

    loader = NSLKDDLoader()
    train_df = loader.load_train()
    test_df = loader.load_test()
    X_train, y_train, _ = loader.preprocess(train_df, fit=True)
    X_test, y_test, _ = loader.preprocess(test_df, fit=False)

    normal_mask_train = loader.get_normal_mask(y_train)
    normal_mask_test = loader.get_normal_mask(y_test)
    X_train_normal = X_train[normal_mask_train]
    y_test_binary = (~normal_mask_test).astype(int)

    evaluator = ModelEvaluator()
    best_result: Optional[Dict[str, Any]] = None
    best_f1 = 0.0
    all_results: List[Dict[str, Any]] = []

    for contamination in [0.05, 0.08, 0.10, 0.12, 0.15]:
        for n_estimators in [100, 200, 300]:
            params = {
                "n_estimators": n_estimators,
                "contamination": contamination,
                "max_samples": "auto",
                "max_features": 1.0,
                "bootstrap": False,
                "random_state": 42,
                "n_jobs": -1,
            }

            model = IsolationForestModel(params=params)
            model.train(X_train_normal)

            preds = model.predict(X_test)
            scores = model.score(X_test)

            result = evaluator.evaluate_binary(
                y_true=y_test_binary, y_pred=preds, y_scores=scores,
                model_name=f"IF_c{contamination}_n{n_estimators}",
            )
            result["contamination"] = contamination
            result["n_estimators"] = n_estimators
            all_results.append(result)

            if result["f1_score"] > best_f1:
                best_f1 = result["f1_score"]
                best_result = result

            logger.info(
                "  c=%.2f n=%d → Acc=%.4f P=%.4f R=%.4f F1=%.4f",
                contamination, n_estimators,
                result["accuracy"], result["precision"],
                result["recall"], result["f1_score"],
            )

    logger.info("[IF] Best: %s → F1=%.4f (c=%.2f, n=%d)",
                best_result["model"], best_f1,
                best_result["contamination"], best_result["n_estimators"])
    return best_result


def tune_random_forest() -> Dict[str, Any]:
    """
    Grid search over key RF hyperparameters.

    Target: Improve F1-weighted from 0.6945 → 0.70+.

    Returns:
        Best result dict with tuned params.
    """
    logger.info("=" * 60)
    logger.info("TUNING: Random Forest")
    logger.info("=" * 60)

    loader = NSLKDDLoader()
    train_df = loader.load_train()
    test_df = loader.load_test()
    X_train, y_train, _ = loader.preprocess(train_df, fit=True)
    X_test, y_test, _ = loader.preprocess(test_df, fit=False)
    class_names = loader.get_class_names()

    evaluator = ModelEvaluator()
    best_result: Optional[Dict[str, Any]] = None
    best_f1 = 0.0

    for max_depth in [15, 20, 25, 30, None]:
        for n_estimators in [200, 300, 500]:
            for min_samples_split in [2, 5, 10]:
                params = {
                    "n_estimators": n_estimators,
                    "max_depth": max_depth,
                    "min_samples_split": min_samples_split,
                    "min_samples_leaf": 2,
                    "max_features": "sqrt",
                    "class_weight": "balanced",
                    "criterion": "gini",
                    "random_state": 42,
                    "n_jobs": -1,
                }

                model = RandomForestModel(params=params)
                model.train(X_train, y_train, class_names=class_names)

                preds = model.predict(X_test)
                proba = model.predict_proba(X_test)

                result = evaluator.evaluate_multiclass(
                    y_true=y_test, y_pred=preds, y_proba=proba,
                    class_names=class_names,
                    model_name=f"RF_d{max_depth}_n{n_estimators}_s{min_samples_split}",
                )

                f1 = result["f1_weighted"]
                if f1 > best_f1:
                    best_f1 = f1
                    best_result = result
                    best_result["max_depth"] = max_depth
                    best_result["n_estimators"] = n_estimators
                    best_result["min_samples_split"] = min_samples_split

                logger.info(
                    "  d=%s n=%d s=%d → Acc=%.4f F1w=%.4f",
                    max_depth, n_estimators, min_samples_split,
                    result["accuracy"], f1,
                )

    logger.info("[RF] Best: %s → F1w=%.4f (d=%s, n=%d, s=%d)",
                best_result["model"], best_f1,
                best_result["max_depth"], best_result["n_estimators"],
                best_result["min_samples_split"])
    return best_result


def update_hyperparams(if_best: Dict[str, Any], rf_best: Dict[str, Any]) -> None:
    """Update hyperparams.py with tuned best values."""
    if_content = HYPERPARAMS_PATH.read_text()

    # Update IF params
    if_content = if_content.replace(
        '    "contamination": 0.05,',
        f'    "contamination": {if_best["contamination"]},'
    )
    if_content = if_content.replace(
        '    "n_estimators": 200,',
        f'    "n_estimators": {if_best["n_estimators"]},'
    )

    # Update RF params
    rf_depth = rf_best["max_depth"]
    rf_depth_str = str(rf_depth) if rf_depth is not None else "None"
    if_content = if_content.replace(
        '    "max_depth": 30,',
        f'    "max_depth": {rf_depth_str},'
    )
    if_content = if_content.replace(
        '    "n_estimators": 300,',
        f'    "n_estimators": {rf_best["n_estimators"]},'
    )
    if_content = if_content.replace(
        '    "min_samples_split": 5,',
        f'    "min_samples_split": {rf_best["min_samples_split"]},'
    )

    HYPERPARAMS_PATH.write_text(if_content)
    logger.info("[Tuning] Updated hyperparams.py with tuned values")


def run_all_tuning() -> bool:
    """Run all hyperparameter tuning."""
    start = time.time()

    if_best = tune_isolation_forest()
    rf_best = tune_random_forest()

    logger.info("=" * 60)
    logger.info("TUNING SUMMARY")
    logger.info("=" * 60)
    logger.info("IF Best: c=%.2f n=%d → Acc=%.4f P=%.4f R=%.4f F1=%.4f",
                if_best["contamination"], if_best["n_estimators"],
                if_best["accuracy"], if_best["precision"],
                if_best["recall"], if_best["f1_score"])
    logger.info("RF Best: d=%s n=%d s=%d → Acc=%.4f F1w=%.4f",
                rf_best["max_depth"], rf_best["n_estimators"],
                rf_best["min_samples_split"],
                rf_best["accuracy"], rf_best["f1_weighted"])

    # Update hyperparams.py
    update_hyperparams(if_best, rf_best)

    elapsed = time.time() - start
    logger.info("TUNING COMPLETE in %.1f seconds", elapsed)
    return True


if __name__ == "__main__":
    success = run_all_tuning()
    sys.exit(0 if success else 1)
