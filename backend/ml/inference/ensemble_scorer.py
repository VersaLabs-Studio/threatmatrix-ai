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

Classification-Driven Severity:
  When RF identifies an attack type, severity is determined by a
  combination of attack threat level, RF confidence, and model
  agreement — not solely by the raw composite score. This accounts
  for the domain gap between NSL-KDD training data and live VPS traffic.

  Score floors enforce minimum adjusted scores per attack+agreement:
    dos/u2r  + unanimous → ≥0.85 (CRITICAL)
    dos/u2r  + majority  → ≥0.72 (HIGH)
    probe/r2l + majority → ≥0.68 (HIGH)
    etc.

Alert severity from adjusted score:
  ≥ 0.80 → CRITICAL
  ≥ 0.65 → HIGH
  ≥ 0.45 → MEDIUM
  ≥ 0.30 → LOW
  < 0.30 → NONE (benign)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np

from ml.training.hyperparams import ENSEMBLE_WEIGHTS, ALERT_THRESHOLDS

logger = logging.getLogger(__name__)

# Classification-driven score floors.
# When RF identifies an attack type, the adjusted score cannot fall
# below the floor for that attack+agreement combination. This ensures
# severity diversity regardless of how narrow the raw composite range is.
#
# Floors are calibrated so that:
#   - DDoS/U2R attacks with consensus → CRITICAL
#   - DDoS/U2R with majority → HIGH
#   - Probe/R2L with consensus → HIGH
#   - Probe/R2L with majority → HIGH (lower end)
#   - Single-model detection → MEDIUM
ATTACK_SCORE_FLOORS: Dict[str, Dict[str, float]] = {
    "dos": {
        "unanimous": 0.88,
        "majority":  0.72,
        "single":    0.55,
    },
    "u2r": {
        "unanimous": 0.92,
        "majority":  0.78,
        "single":    0.60,
    },
    "r2l": {
        "unanimous": 0.80,
        "majority":  0.68,
        "single":    0.50,
    },
    "probe": {
        "unanimous": 0.75,
        "majority":  0.65,
        "single":    0.48,
    },
}

# Additional RF confidence boost thresholds
RF_HIGH_CONFIDENCE_THRESHOLD = 0.75
RF_HIGH_CONFIDENCE_BOOST = 0.08


class EnsembleScorer:
    """
    Combines scores from all three models into a composite anomaly score,
    then applies classification-driven severity determination based on
    RF attack type + model agreement.
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
        Compute raw composite anomaly scores.

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

        Uses a two-stage approach:
        1. Compute raw composite score (weighted average of model scores)
        2. Apply classification-driven severity escalation based on
           RF attack label, RF confidence, and model agreement

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

        raw_composite = self.score(if_scores, rf_attack_conf, ae_scores)

        results = []
        for i in range(len(raw_composite)):
            rf_pred = rf_predictions[i]
            base_score = float(raw_composite[i])

            # Compute model agreement
            agreement = self._agreement(
                if_scores[i] > 0.5,
                rf_pred["is_anomaly"],
                ae_scores[i] > 0.5,
            )

            # Classification-driven severity escalation
            adjusted_score = self._escalate_score(
                base_score, rf_pred, agreement
            )

            severity = self._severity(adjusted_score)

            results.append({
                "composite_score": adjusted_score,
                "raw_composite": base_score,
                "severity": severity,
                "is_anomaly": severity != "none",
                "label": rf_pred["label"] if rf_pred["is_anomaly"] else "normal",
                "rf_label": rf_pred["label"],
                "rf_confidence": rf_pred["confidence"],
                "if_score": float(if_scores[i]),
                "ae_score": float(ae_scores[i]),
                "model_agreement": agreement,
            })

        return results

    def _escalate_score(
        self,
        base_score: float,
        rf_pred: Dict[str, Any],
        agreement: str,
    ) -> float:
        """
        Apply classification-driven score escalation.

        When RF identifies a specific attack type, enforces a minimum
        score floor based on the attack's threat level and how many
        models agree. This ensures severity diversity even when the raw
        composite is narrow due to model-training data domain gaps.

        Args:
            base_score: Raw composite score from weighted average
            rf_pred: RF prediction dict with label, confidence, is_anomaly
            agreement: Model agreement level (unanimous/majority/single/none)

        Returns:
            Adjusted score (>= base_score when escalated).
        """
        if not rf_pred["is_anomaly"]:
            return base_score

        label = rf_pred["label"]
        rf_conf = rf_pred["confidence"]

        # Look up score floor for this attack type + agreement level
        floors = ATTACK_SCORE_FLOORS.get(label)
        if floors is None:
            return base_score

        floor = floors.get(agreement, 0.0)

        # Enforce floor: adjusted score cannot be below the floor
        adjusted = max(base_score, floor)

        # Additional boost for high RF confidence
        if rf_conf >= RF_HIGH_CONFIDENCE_THRESHOLD:
            adjusted = min(adjusted + RF_HIGH_CONFIDENCE_BOOST, 1.0)

        return adjusted

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
