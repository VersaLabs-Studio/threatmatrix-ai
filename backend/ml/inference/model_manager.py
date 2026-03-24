"""
ThreatMatrix AI — Model Manager

Loads all three trained models and provides a unified scoring interface.
Used by the ML Worker (inference loop) and ML API endpoints.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from ml.models.isolation_forest import IsolationForestModel
from ml.models.random_forest import RandomForestModel
from ml.models.autoencoder import AutoencoderModel
from ml.inference.ensemble_scorer import EnsembleScorer

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "saved_models"


class ModelManager:
    """
    Manages loading and inference for all three ML models.
    Provides single-call scoring that runs all models + ensemble.
    """

    def __init__(self, models_dir: Optional[Path] = None) -> None:
        self.models_dir = models_dir or MODELS_DIR
        self.if_model = IsolationForestModel()
        self.rf_model = RandomForestModel()
        self.ae_model = AutoencoderModel()
        self.scorer = EnsembleScorer()
        self._loaded = False

    def load_all(self) -> Dict[str, bool]:
        """Load all available models. Returns status dict."""
        status = {"isolation_forest": False, "random_forest": False, "autoencoder": False}

        try:
            self.if_model.load(self.models_dir / "isolation_forest.pkl")
            status["isolation_forest"] = True
            logger.info("[Manager] Isolation Forest loaded")
        except FileNotFoundError:
            logger.warning("[Manager] Isolation Forest model not found")

        try:
            self.rf_model.load(self.models_dir / "random_forest.pkl")
            status["random_forest"] = True
            logger.info("[Manager] Random Forest loaded")
        except FileNotFoundError:
            logger.warning("[Manager] Random Forest model not found")

        try:
            self.ae_model.load(self.models_dir / "autoencoder")
            status["autoencoder"] = True
            logger.info("[Manager] Autoencoder loaded")
        except FileNotFoundError:
            logger.warning("[Manager] Autoencoder model not found")

        self._loaded = any(status.values())
        logger.info("[Manager] Models loaded: %s", status)
        return status

    def score_flows(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """
        Score flows through all loaded models + ensemble.

        Args:
            X: Feature matrix (n_samples, n_features), already preprocessed.

        Returns:
            List of scoring result dicts per sample.
        """
        if not self._loaded:
            raise RuntimeError("No models loaded. Call load_all() first.")

        # Get individual model scores
        if_scores = self.if_model.score(X) if self.if_model._is_fitted else np.zeros(len(X))
        rf_preds = (
            self.rf_model.predict_with_confidence(X)
            if self.rf_model._is_fitted
            else [{"label": "unknown", "confidence": 0.0, "is_anomaly": False,
                   "class_probabilities": {}} for _ in range(len(X))]
        )
        ae_scores = self.ae_model.score(X) if self.ae_model._is_fitted else np.zeros(len(X))

        # Ensemble scoring
        results = self.scorer.classify(if_scores, rf_preds, ae_scores)
        return results

    def get_model_info(self) -> Dict[str, Any]:
        """Get info about loaded models for API response."""
        return {
            "models_loaded": {
                "isolation_forest": self.if_model._is_fitted,
                "random_forest": self.rf_model._is_fitted,
                "autoencoder": self.ae_model._is_fitted,
            },
            "ensemble_weights": self.scorer.weights,
            "alert_thresholds": self.scorer.thresholds,
            "models_dir": str(self.models_dir),
        }
