"""
ThreatMatrix AI — Master Training Script

Trains all models on NSL-KDD dataset:
1. Load and preprocess NSL-KDD
2. Train Isolation Forest on normal data
3. Train Random Forest on all labeled data
4. Train Autoencoder on normal data (deep learning)
5. Ensemble scoring test (composite = 0.30×IF + 0.45×RF + 0.25×AE)
6. Model comparison

Run: python -m ml.training.train_all
"""

from __future__ import annotations

import logging
import sys
import time
from pathlib import Path

import numpy as np

from ml.datasets.nsl_kdd import NSLKDDLoader
from ml.models.isolation_forest import IsolationForestModel
from ml.models.random_forest import RandomForestModel
from ml.models.autoencoder import AutoencoderModel
from ml.training.evaluate import ModelEvaluator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def train_all() -> bool:
    """Train all models and evaluate."""
    start_time = time.time()
    evaluator = ModelEvaluator()
    all_results = []

    # -- Step 1: Load NSL-KDD --
    logger.info("=" * 60)
    logger.info("STEP 1: Loading NSL-KDD dataset")
    logger.info("=" * 60)

    loader = NSLKDDLoader()
    train_df = loader.load_train()
    test_df = loader.load_test()

    X_train, y_train, feature_names = loader.preprocess(train_df, fit=True)
    X_test, y_test, _ = loader.preprocess(test_df, fit=False)

    normal_mask_train = loader.get_normal_mask(y_train)
    normal_mask_test = loader.get_normal_mask(y_test)
    class_names = loader.get_class_names()

    logger.info("Train: %s, Test: %s, Classes: %s", X_train.shape, X_test.shape, class_names)

    # -- Step 2: Train Isolation Forest --
    logger.info("=" * 60)
    logger.info("STEP 2: Training Isolation Forest (unsupervised)")
    logger.info("=" * 60)

    X_train_normal = X_train[normal_mask_train]
    logger.info("Normal training samples: %d", len(X_train_normal))

    if_model = IsolationForestModel()
    if_meta = if_model.train(X_train_normal)

    # Evaluate IF (binary: normal vs anomaly)
    y_test_binary = (~normal_mask_test).astype(int)  # 0=normal, 1=anomaly
    if_preds = if_model.predict(X_test)
    if_scores = if_model.score(X_test)

    if_eval = evaluator.evaluate_binary(
        y_true=y_test_binary,
        y_pred=if_preds,
        y_scores=if_scores,
        model_name="isolation_forest",
    )
    evaluator.save_results(if_eval)
    all_results.append(if_eval)

    if_model.save()
    logger.info("[IF] Accuracy: %.4f | F1: %.4f", if_eval["accuracy"], if_eval["f1_score"])

    # -- Step 3: Train Random Forest --
    logger.info("=" * 60)
    logger.info("STEP 3: Training Random Forest (supervised, 5-class)")
    logger.info("=" * 60)

    rf_model = RandomForestModel()
    rf_meta = rf_model.train(X_train, y_train, class_names=class_names)

    # Evaluate RF (multi-class)
    rf_preds = rf_model.predict(X_test)
    rf_proba = rf_model.predict_proba(X_test)

    rf_eval = evaluator.evaluate_multiclass(
        y_true=y_test,
        y_pred=rf_preds,
        y_proba=rf_proba,
        class_names=class_names,
        model_name="random_forest",
    )
    evaluator.save_results(rf_eval)
    all_results.append(rf_eval)

    rf_model.save()

    # Feature importance report
    importance = rf_model.get_feature_importance(feature_names)
    logger.info("Top 10 features:")
    for i, fi in enumerate(importance[:10], 1):
        logger.info("  %d. %s: %.4f", i, fi["feature"], fi["importance"])

    # -- Step 4: Train Autoencoder --
    logger.info("=" * 60)
    logger.info("STEP 4: Training Autoencoder (deep learning)")
    logger.info("=" * 60)

    ae_model = AutoencoderModel()
    ae_meta = ae_model.train(X_train_normal)

    # Evaluate AE (binary: normal vs anomaly)
    ae_preds = ae_model.predict(X_test)
    ae_scores = ae_model.score(X_test)

    ae_eval = evaluator.evaluate_binary(
        y_true=y_test_binary,
        y_pred=ae_preds,
        y_scores=ae_scores,
        model_name="autoencoder",
    )
    evaluator.save_results(ae_eval)
    all_results.append(ae_eval)

    ae_model.save()
    logger.info("[AE] Accuracy: %.4f | F1: %.4f", ae_eval["accuracy"], ae_eval["f1_score"])

    # -- Step 5: Ensemble Test --
    logger.info("=" * 60)
    logger.info("STEP 5: Ensemble Scoring Test")
    logger.info("=" * 60)

    from ml.inference.ensemble_scorer import EnsembleScorer

    scorer = EnsembleScorer()
    rf_preds_full = rf_model.predict_with_confidence(X_test)
    rf_attack_conf = np.array([
        1.0 - p["class_probabilities"].get("normal", 1.0) if p["is_anomaly"]
        else 0.0
        for p in rf_preds_full
    ])

    composite = scorer.score(if_scores, rf_attack_conf, ae_scores)
    composite_preds = (composite >= 0.30).astype(int)

    ensemble_eval = evaluator.evaluate_binary(
        y_true=y_test_binary,
        y_pred=composite_preds,
        y_scores=composite,
        model_name="ensemble",
    )
    evaluator.save_results(ensemble_eval)
    all_results.append(ensemble_eval)

    logger.info("[Ensemble] Accuracy: %.4f | F1: %.4f | AUC: %.4f",
                ensemble_eval["accuracy"], ensemble_eval["f1_score"],
                ensemble_eval.get("auc_roc", 0.0))

    # -- Step 6: Model Comparison --
    logger.info("=" * 60)
    logger.info("STEP 6: Model Comparison")
    logger.info("=" * 60)

    comparison = evaluator.compare_models(all_results)
    logger.info("Best accuracy: %s", comparison["best_accuracy"])
    logger.info("Best F1: %s", comparison["best_f1"])

    # -- Summary --
    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info("TRAINING COMPLETE in %.1f seconds", elapsed)
    logger.info("  Isolation Forest: saved to saved_models/isolation_forest.pkl")
    logger.info("  Random Forest:    saved to saved_models/random_forest.pkl")
    logger.info("  Autoencoder:      saved to saved_models/autoencoder/")
    logger.info("  Evaluations:      saved to saved_models/eval_results/")
    logger.info("=" * 60)

    return True


if __name__ == "__main__":
    success = train_all()
    sys.exit(0 if success else 1)
