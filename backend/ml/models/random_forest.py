"""
ThreatMatrix AI — Random Forest Classifier

Per MASTER_DOC_PART4 §5: Supervised multi-class classification.
Trained on ALL labeled data (normal + attacks).

Hyperparameters from §5.2:
- n_estimators: 300
- max_depth: 30
- class_weight: 'balanced'

Classes (NSL-KDD): normal, dos, probe, r2l, u2r
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier as SklearnRF

from ml.training.hyperparams import RANDOM_FOREST_PARAMS

logger = logging.getLogger(__name__)

SAVE_DIR = Path(__file__).parent.parent / "saved_models"


class RandomForestModel:
    """
    Random Forest wrapper for ThreatMatrix AI.

    Training: Fit on ALL labeled data (supervised classification).
    Inference: Predict class + confidence for each flow.
    """

    MODEL_NAME = "random_forest"

    def __init__(self, params: Optional[Dict[str, Any]] = None) -> None:
        self.params = params or RANDOM_FOREST_PARAMS.copy()
        self.model: Optional[SklearnRF] = None
        self.class_names: List[str] = []
        self._is_fitted = False

    def train(
        self, X: np.ndarray, y: np.ndarray, class_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Train on labeled data (all classes).

        Args:
            X: Feature matrix (all samples)
            y: Label array (integer encoded)
            class_names: Optional list of class names

        Returns:
            Training metadata dict.
        """
        self.class_names = class_names or [str(i) for i in range(len(np.unique(y)))]

        logger.info(
            "[RF] Training on %d samples, %d features, %d classes",
            X.shape[0], X.shape[1], len(self.class_names)
        )

        self.model = SklearnRF(**self.params)
        self.model.fit(X, y)
        self._is_fitted = True

        # Training accuracy
        train_preds = self.model.predict(X)
        train_accuracy = float((train_preds == y).mean())

        # Feature importance
        importances = self.model.feature_importances_
        top_10_idx = np.argsort(importances)[::-1][:10]

        metadata = {
            "model": self.MODEL_NAME,
            "n_samples": X.shape[0],
            "n_features": X.shape[1],
            "n_classes": len(self.class_names),
            "class_names": self.class_names,
            "params": self.params,
            "train_accuracy": train_accuracy,
            "top_10_feature_indices": top_10_idx.tolist(),
            "top_10_importances": importances[top_10_idx].tolist(),
        }

        logger.info("[RF] Training complete. Train accuracy: %.4f", train_accuracy)
        return metadata

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict class labels."""
        if not self._is_fitted:
            raise RuntimeError("Model not trained. Call train() first.")
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class probabilities."""
        if not self._is_fitted:
            raise RuntimeError("Model not trained. Call train() first.")
        return self.model.predict_proba(X)

    def predict_with_confidence(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """
        Predict with label name and confidence.

        Returns:
            List of dicts with 'label', 'confidence', 'is_anomaly'.
        """
        predictions = self.predict(X)
        probabilities = self.predict_proba(X)

        results = []
        for i, (pred, proba) in enumerate(zip(predictions, probabilities)):
            label = self.class_names[pred] if pred < len(self.class_names) else "unknown"
            confidence = float(np.max(proba))
            results.append({
                "label": label,
                "confidence": confidence,
                "is_anomaly": label != "normal",
                "class_probabilities": {
                    name: float(p) for name, p in zip(self.class_names, proba)
                },
            })
        return results

    def get_feature_importance(self, feature_names: List[str]) -> List[Dict[str, float]]:
        """Get sorted feature importances."""
        if not self._is_fitted:
            raise RuntimeError("Model not trained.")
        importances = self.model.feature_importances_
        pairs = sorted(
            zip(feature_names, importances), key=lambda x: x[1], reverse=True
        )
        return [{"feature": name, "importance": float(imp)} for name, imp in pairs]

    def save(self, path: Optional[Path] = None) -> Path:
        """Save trained model + class names."""
        if not self._is_fitted:
            raise RuntimeError("Cannot save untrained model.")
        save_path = path or SAVE_DIR / f"{self.MODEL_NAME}.pkl"
        save_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": self.model, "class_names": self.class_names}, save_path)
        logger.info("[RF] Model saved to %s", save_path)
        return save_path

    def load(self, path: Optional[Path] = None) -> None:
        """Load trained model + class names."""
        load_path = path or SAVE_DIR / f"{self.MODEL_NAME}.pkl"
        if not load_path.exists():
            raise FileNotFoundError(f"Model not found: {load_path}")
        data = joblib.load(load_path)
        self.model = data["model"]
        self.class_names = data["class_names"]
        self._is_fitted = True
        logger.info("[RF] Model loaded from %s", load_path)
