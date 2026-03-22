"""
ThreatMatrix AI — NSL-KDD Dataset Validation

Validate the full NSL-KDD loader pipeline with actual dataset files.
Run on VPS: python -m ml.datasets.validate_nsl_kdd

Per MASTER_DOC_PART4 §2.1, §2.4
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

import numpy as np

from ml.datasets.nsl_kdd import NSLKDDLoader, NSL_KDD_FEATURE_NAMES, ATTACK_CATEGORIES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def validate() -> bool:
    """Run full validation suite."""
    loader = NSLKDDLoader()
    errors: list[str] = []

    # 1. Load raw data
    logger.info("=== Step 1: Load raw data ===")
    try:
        train_df = loader.load_train()
        test_df = loader.load_test()
        logger.info("Train: %d records, %d columns", len(train_df), len(train_df.columns))
        logger.info("Test: %d records, %d columns", len(test_df), len(test_df.columns))

        assert len(train_df) > 100000, f"Train too small: {len(train_df)}"
        assert len(test_df) > 20000, f"Test too small: {len(test_df)}"
        ncols = len(train_df.columns)
        assert ncols >= 42, f"Expected at least 42 columns, got {ncols}"
    except Exception as e:
        errors.append(f"Load failed: {e}")
        logger.error("FAIL: %s", e)
        return False

    # 2. Check column names (first 41 should match feature names)
    logger.info("=== Step 2: Verify column names ===")
    ncols = len(train_df.columns)
    feature_cols = list(train_df.columns[:41])
    expected_features = NSL_KDD_FEATURE_NAMES
    if feature_cols != expected_features:
        errors.append(f"Feature column mismatch: {set(expected_features) - set(feature_cols)}")
    else:
        logger.info("PASS: First 41 columns match NSL-KDD spec (total %d columns)", ncols)
    assert "label" in train_df.columns, "Missing 'label' column"

    # 3. Check attack label distribution
    logger.info("=== Step 3: Attack label distribution ===")
    labels = train_df["label"].astype(str).str.strip().str.lower()
    mapped = labels.map(ATTACK_CATEGORIES)
    unmapped = labels[mapped.isna()].unique()
    if len(unmapped) > 0:
        logger.warning("Unmapped labels: %s", unmapped)

    category_counts = mapped.dropna().value_counts()
    logger.info("Category distribution:\n%s", category_counts)

    assert "normal" in category_counts.index, "Missing 'normal' class"
    assert "dos" in category_counts.index, "Missing 'dos' class"
    assert "probe" in category_counts.index, "Missing 'probe' class"

    # 4. Preprocess
    logger.info("=== Step 4: Preprocess (fit) ===")
    X_train, y_train, feature_names = loader.preprocess(train_df, fit=True)
    logger.info("X_train shape: %s, y_train shape: %s", X_train.shape, y_train.shape)
    logger.info("Feature names: %d features", len(feature_names))
    logger.info("Classes: %s", loader.get_class_names())

    assert X_train.shape[1] == len(feature_names), "Feature count mismatch"
    assert not np.isnan(X_train).any(), "NaN values in preprocessed data"
    assert not np.isinf(X_train).any(), "Inf values in preprocessed data"

    # 5. Preprocess test (transform only)
    logger.info("=== Step 5: Preprocess test set (transform) ===")
    X_test, y_test, _ = loader.preprocess(test_df, fit=False)
    logger.info("X_test shape: %s, y_test shape: %s", X_test.shape, y_test.shape)

    assert X_test.shape[1] == X_train.shape[1], "Train/test feature count mismatch"

    # 6. Normal mask for unsupervised models
    logger.info("=== Step 6: Normal traffic mask ===")
    normal_mask = loader.get_normal_mask(y_train)
    normal_count = int(normal_mask.sum())
    logger.info(
        "Normal samples: %d / %d (%.1f%%)",
        normal_count, len(y_train), 100 * normal_count / len(y_train)
    )

    assert normal_count > 50000, f"Too few normal samples: {normal_count}"

    # 7. Summary
    logger.info("=" * 60)
    if errors:
        logger.error("VALIDATION FAILED: %d errors", len(errors))
        for e in errors:
            logger.error("  - %s", e)
        return False
    else:
        logger.info("ALL VALIDATIONS PASSED")
        logger.info("  Train: %s -> %s", train_df.shape, X_train.shape)
        logger.info("  Test:  %s -> %s", test_df.shape, X_test.shape)
        logger.info("  Classes: %s", loader.get_class_names())
        logger.info("  Normal: %d samples (for unsupervised training)", normal_count)
        return True


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
