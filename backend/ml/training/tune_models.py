"""
ThreatMatrix AI — Hyperparameter Tuning

Per MASTER_DOC_PART4:
  - §4.4: Isolation Forest grid search parameters
  - §5.3: Random Forest grid search parameters

Grid Search Parameters:
  IF: n_estimators=[100,200,300,500],
      contamination=[0.01,0.03,0.05,0.10],
      max_samples=[256,512,1024,'auto']
  RF: n_estimators=[200,300,500],
      max_depth=[20,30,50],
      min_samples_split=[2,5,10]

Output: ml/saved_models/best_params.json

NOTE: Current ensemble weights (0.30/0.45/0.25) and alert thresholds
      (0.90/0.75/0.50/0.30) are LOCKED and MUST NOT change.

Run: python -m ml.training.tune_models
"""

from __future__ import annotations

import json
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

SAVED_MODELS_DIR = Path(__file__).parent.parent.parent / "ml" / "saved_models"
BEST_PARAMS_PATH = SAVED_MODELS_DIR / "best_params.json"


def tune_isolation_forest() -> Dict[str, Any]:
    """
    Grid search over IF hyperparameters per MASTER_DOC_PART4 §4.4.

    Search space:
      n_estimators:  [100, 200, 300, 500]
      contamination: [0.01, 0.03, 0.05, 0.10]
      max_samples:   [256, 512, 1024, 'auto']

    Returns:
        Best result dict with tuned params.
    """
    logger.info("=" * 60)
    logger.info("TUNING: Isolation Forest (MASTER_DOC_PART4 §4.4)")
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

    for n_estimators in [100, 200, 300, 500]:
        for contamination in [0.01, 0.03, 0.05, 0.10]:
            for max_samples in [256, 512, 1024, "auto"]:
                params = {
                    "n_estimators": n_estimators,
                    "contamination": contamination,
                    "max_samples": max_samples,
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
                    y_true=y_test_binary,
                    y_pred=preds,
                    y_scores=scores,
                    model_name=f"IF_n{n_estimators}_c{contamination}_ms{max_samples}",
                )
                result["contamination"] = contamination
                result["n_estimators"] = n_estimators
                result["max_samples"] = str(max_samples)
                all_results.append(result)

                if result["f1_score"] > best_f1:
                    best_f1 = result["f1_score"]
                    best_result = result

                logger.info(
                    "  n=%d c=%.2f ms=%s → Acc=%.4f P=%.4f R=%.4f F1=%.4f",
                    n_estimators, contamination, max_samples,
                    result["accuracy"], result["precision"],
                    result["recall"], result["f1_score"],
                )

    logger.info(
        "[IF] Best: F1=%.4f (n=%d, c=%.2f, ms=%s)",
        best_f1,
        best_result["n_estimators"],
        best_result["contamination"],
        best_result["max_samples"],
    )
    return best_result


def tune_random_forest() -> Dict[str, Any]:
    """
    Grid search over RF hyperparameters per MASTER_DOC_PART4 §5.3.

    Search space:
      n_estimators:      [200, 300, 500]
      max_depth:         [20, 30, 50]
      min_samples_split: [2, 5, 10]

    Returns:
        Best result dict with tuned params.
    """
    logger.info("=" * 60)
    logger.info("TUNING: Random Forest (MASTER_DOC_PART4 §5.3)")
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
    all_results: List[Dict[str, Any]] = []

    for n_estimators in [200, 300, 500]:
        for max_depth in [20, 30, 50]:
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
                    y_true=y_test,
                    y_pred=preds,
                    y_proba=proba,
                    class_names=class_names,
                    model_name=f"RF_n{n_estimators}_d{max_depth}_s{min_samples_split}",
                )

                f1 = result["f1_weighted"]
                if f1 > best_f1:
                    best_f1 = f1
                    best_result = result
                    best_result["max_depth"] = max_depth
                    best_result["n_estimators"] = n_estimators
                    best_result["min_samples_split"] = min_samples_split

                all_results.append(result)
                logger.info(
                    "  n=%d d=%d s=%d → Acc=%.4f F1w=%.4f",
                    n_estimators, max_depth, min_samples_split,
                    result["accuracy"], f1,
                )

    logger.info(
        "[RF] Best: F1w=%.4f (n=%d, d=%d, s=%d)",
        best_f1,
        best_result["n_estimators"],
        best_result["max_depth"],
        best_result["min_samples_split"],
    )
    return best_result


def save_best_params(
    if_best: Dict[str, Any],
    rf_best: Dict[str, Any],
) -> None:
    """
    Save best hyperparameters to ml/saved_models/best_params.json.

    These can be applied to a future retrain cycle.
    Ensemble weights (0.30/0.45/0.25) and alert thresholds
    (0.90/0.75/0.50/0.30) are LOCKED and NOT included here.
    """
    output = {
        "isolation_forest": {
            "n_estimators": if_best["n_estimators"],
            "contamination": if_best["contamination"],
            "max_samples": if_best["max_samples"],
            "accuracy": if_best["accuracy"],
            "precision": if_best["precision"],
            "recall": if_best["recall"],
            "f1_score": if_best["f1_score"],
        },
        "random_forest": {
            "n_estimators": rf_best["n_estimators"],
            "max_depth": rf_best["max_depth"],
            "min_samples_split": rf_best["min_samples_split"],
            "accuracy": rf_best["accuracy"],
            "f1_weighted": rf_best["f1_weighted"],
        },
        "ensemble_weights": {
            "NOTE": "LOCKED — do not change",
            "if_weight": 0.30,
            "rf_weight": 0.45,
            "ae_weight": 0.25,
        },
        "alert_thresholds": {
            "NOTE": "LOCKED — do not change",
            "critical": 0.90,
            "high": 0.75,
            "medium": 0.50,
            "low": 0.30,
        },
        "tuned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    with open(BEST_PARAMS_PATH, "w") as f:
        json.dump(output, f, indent=2)

    logger.info("[Tuning] Best params saved to %s", BEST_PARAMS_PATH)


def run_all_tuning() -> bool:
    """Run all hyperparameter tuning and save results."""
    start = time.time()

    if_best = tune_isolation_forest()
    rf_best = tune_random_forest()

    logger.info("=" * 60)
    logger.info("TUNING SUMMARY")
    logger.info("=" * 60)
    logger.info(
        "IF Best: n=%d c=%.2f ms=%s → Acc=%.4f P=%.4f R=%.4f F1=%.4f",
        if_best["n_estimators"], if_best["contamination"],
        if_best["max_samples"],
        if_best["accuracy"], if_best["precision"],
        if_best["recall"], if_best["f1_score"],
    )
    logger.info(
        "RF Best: n=%d d=%s s=%d → Acc=%.4f F1w=%.4f",
        rf_best["n_estimators"], rf_best["max_depth"],
        rf_best["min_samples_split"],
        rf_best["accuracy"], rf_best["f1_weighted"],
    )

    # Save best params to ml/saved_models/best_params.json
    save_best_params(if_best, rf_best)

    elapsed = time.time() - start
    logger.info("TUNING COMPLETE in %.1f seconds", elapsed)
    return True


if __name__ == "__main__":
    success = run_all_tuning()
    sys.exit(0 if success else 1)
