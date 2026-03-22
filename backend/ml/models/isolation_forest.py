"""
ThreatMatrix AI — Isolation Forest Model

Per MASTER_DOC_PART4 §4: Unsupervised anomaly detection.
Trained on NORMAL traffic only — anomalies are "few and different."

Hyperparameters from §4.3:
- n_estimators: 200
- contamination: 0.05
- max_samples: 'auto'
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest as SklearnIF

from ml.training.hyperparams import ISOLATION_FOREST_PARAMS

logger = logging.getLogger(__name__)

SAVE_DIR = Path(__file__).parent.parent / "saved_models"


class IsolationForestModel:
    """
    Isolation Forest wrapper for ThreatMatrix AI.

    Training: Fit on normal traffic only (unsupervised).
    Inference: Score flows — higher score = more anomalous.
    """

    MODEL_NAME = "isolation_forest"

    def __init__(self, params: Optional[Dict[str, Any]] = None) -> None:
        self.params = params or ISOLATION_FOREST_PARAMS.copy()
        self.model: Optional[SklearnIF] = None
        self._is_fitted = False

    def train(self, X_normal: np.ndarray) -> Dict[str, Any]:
        """
        Train on normal traffic only.

        Args:
            X_normal: Feature matrix of NORMAL traffic samples only.

        Returns:
            Training metadata dict.
        """
        logger.info(
            "[IF] Training on %d normal samples with %d features",
            X_normal.shape[0], X_normal.shape[1]
        )

        self.model = SklearnIF(**self.params)
        self.model.fit(X_normal)
        self._is_fitted = True

        # Compute training scores for threshold calibration
        train_scores = self.model.decision_function(X_normal)
        train_preds = self.model.predict(X_normal)

        metadata = {
            "model": self.MODEL_NAME,
            "n_samples": X_normal.shape[0],
            "n_features": X_normal.shape[1],
            "params": self.params,
            "train_anomaly_rate": float((train_preds == -1).mean()),
            "train_score_mean": float(np.mean(train_scores)),
            "train_score_std": float(np.std(train_scores)),
        }

        logger.info(
            "[IF] Training complete. Anomaly rate on train: %.2f%%",
            metadata["train_anomaly_rate"] * 100
        )
        return metadata

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomaly labels.

        Returns:
            Array of 0 (normal) or 1 (anomaly).
        """
        if not self._is_fitted:
            raise RuntimeError("Model not trained. Call train() first.")

        raw_preds = self.model.predict(X)
        # sklearn returns 1=normal, -1=anomaly → convert to 0=normal, 1=anomaly
        return (raw_preds == -1).astype(int)

    def score(self, X: np.ndarray) -> np.ndarray:
        """
        Compute anomaly scores (0.0 = very normal, 1.0 = very anomalous).

        Returns:
            Normalized anomaly scores array.
        """
        if not self._is_fitted:
            raise RuntimeError("Model not trained. Call train() first.")

        # decision_function: lower = more anomalous
        raw_scores = self.model.decision_function(X)
        # Normalize to [0, 1] where 1 = most anomalous
        # Negate so higher = more anomalous, then min-max scale
        negated = -raw_scores
        min_val = negated.min()
        max_val = negated.max()
        if max_val - min_val == 0:
            return np.zeros(len(X))
        normalized = (negated - min_val) / (max_val - min_val)
        return normalized

    def save(self, path: Optional[Path] = None) -> Path:
        """Save trained model to disk."""
        if not self._is_fitted:
            raise RuntimeError("Cannot save untrained model.")

        save_path = path or SAVE_DIR / f"{self.MODEL_NAME}.pkl"
        save_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, save_path)
        logger.info("[IF] Model saved to %s", save_path)
        return save_path

    def load(self, path: Optional[Path] = None) -> None:
        """Load trained model from disk."""
        load_path = path or SAVE_DIR / f"{self.MODEL_NAME}.pkl"
        if not load_path.exists():
            raise FileNotFoundError(f"Model not found: {load_path}")

        self.model = joblib.load(load_path)
        self._is_fitted = True
        logger.info("[IF] Model loaded from %s", load_path)
