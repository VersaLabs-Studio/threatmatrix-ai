"""
ThreatMatrix AI — Ensemble Scorer

Per MASTER_DOC_PART4 §1.2: Composite anomaly scoring.

Three models score every flow independently:
  1. Isolation Forest   → anomaly score [0, 1]
  2. Random Forest      → max(attack_probabilities)
  3. Autoencoder        → normalized reconstruction error [0, 1]

Composite:
  composite = W_IF × IF_score + W_RF × RF_confidence + W_AE × AE_score
  W_IF = 0.30, W_RF = 0.45, W_AE = 0.25

Alert severity from composite score:
  ≥ 0.90 → CRITICAL
  ≥ 0.75 → HIGH
  ≥ 0.50 → MEDIUM
  ≥ 0.30 → LOW
  < 0.30 → NONE (benign)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np

from ml.training.hyperparams import ENSEMBLE_WEIGHTS, ALERT_THRESHOLDS

logger = logging.getLogger(__name__)


class EnsembleScorer:
    """
    Combines scores from all three models into a composite anomaly score.
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        thresholds: Optional[Dict[str, float]] = None,
    ) -> None:
        self.weights = weights or ENSEMBLE_WEIGHTS.copy()
        self.thresholds = thresholds or ALERT_THRESHOLDS.copy()

        # Validate weights sum to 1.0
        total = sum(self.weights.values())
        if abs(total - 1.0) > 0.01:
            logger.warning("[Ensemble] Weights sum to %.2f, not 1.0. Normalizing.", total)
            for k in self.weights:
                self.weights[k] /= total

    def score(
        self,
        if_scores: np.ndarray,
        rf_confidences: np.ndarray,
        ae_scores: np.ndarray,
    ) -> np.ndarray:
        """
        Compute composite anomaly scores.

        Args:
            if_scores: Isolation Forest anomaly scores [0, 1] (higher = more anomalous)
            rf_confidences: Random Forest attack confidence [0, 1] (max attack class probability)
            ae_scores: Autoencoder normalized reconstruction error [0, 1]

        Returns:
            Composite scores array [0, 1].
        """
        composite = (
            self.weights["isolation_forest"] * if_scores
            + self.weights["random_forest"] * rf_confidences
            + self.weights["autoencoder"] * ae_scores
        )
        return np.clip(composite, 0.0, 1.0)

    def classify(
        self,
        if_scores: np.ndarray,
        rf_predictions: List[Dict[str, Any]],
        ae_scores: np.ndarray,
    ) -> List[Dict[str, Any]]:
        """
        Full classification: composite score + severity + label.

        Args:
            if_scores: IF anomaly scores
            rf_predictions: RF prediction dicts (from predict_with_confidence)
            ae_scores: AE normalized scores

        Returns:
            List of classification result dicts.
        """
        # Extract RF confidence for attack classes (not normal)
        rf_attack_conf = np.array([
            1.0 - p["class_probabilities"].get("normal", 1.0) if p["is_anomaly"]
            else 0.0
            for p in rf_predictions
        ])

        composite = self.score(if_scores, rf_attack_conf, ae_scores)

        results = []
        for i in range(len(composite)):
            severity = self._severity(composite[i])
            rf_pred = rf_predictions[i]

            results.append({
                "composite_score": float(composite[i]),
                "severity": severity,
                "is_anomaly": severity != "none",
                "label": rf_pred["label"] if rf_pred["is_anomaly"] else "normal",
                "rf_label": rf_pred["label"],
                "rf_confidence": rf_pred["confidence"],
                "if_score": float(if_scores[i]),
                "ae_score": float(ae_scores[i]),
                "model_agreement": self._agreement(
                    if_scores[i] > 0.5,
                    rf_pred["is_anomaly"],
                    ae_scores[i] > 0.5,
                ),
            })

        return results

    def _severity(self, score: float) -> str:
        """Map composite score to alert severity."""
        if score >= self.thresholds["critical"]:
            return "critical"
        if score >= self.thresholds["high"]:
            return "high"
        if score >= self.thresholds["medium"]:
            return "medium"
        if score >= self.thresholds["low"]:
            return "low"
        return "none"

    @staticmethod
    def _agreement(if_anomaly: bool, rf_anomaly: bool, ae_anomaly: bool) -> str:
        """Classify model agreement level."""
        count = sum([if_anomaly, rf_anomaly, ae_anomaly])
        if count == 3:
            return "unanimous"
        if count == 2:
            return "majority"
        if count == 1:
            return "single"
        return "none"
