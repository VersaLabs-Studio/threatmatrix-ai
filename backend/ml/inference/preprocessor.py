"""
ThreatMatrix AI — Live Flow Preprocessor

Converts raw flow feature dicts (from capture engine) into model-ready
numpy arrays using the same preprocessing as training.

Pipeline:
1. Extract 40 NSL-KDD features from flow dict
2. Encode categoricals (protocol_type, service, flag) with stored LabelEncoders
3. Scale numericals with stored StandardScaler
4. Return numpy array ready for model inference
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# The 40 NSL-KDD feature names in training order
NSL_KDD_FEATURES = [
    "duration", "protocol_type", "service", "flag",
    "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent",
    "hot", "num_failed_logins", "logged_in", "num_compromised",
    "root_shell", "su_attempted", "num_root", "num_file_creations",
    "num_shells", "num_access_files", "is_host_login", "is_guest_login",
    "count", "srv_count", "serror_rate", "srv_serror_rate",
    "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
    "srv_diff_host_rate",
    "dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate",
    "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate",
    "dst_host_srv_serror_rate", "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate",
]

CATEGORICAL_FEATURES = ["protocol_type", "service", "flag"]

SAVE_DIR = Path(__file__).parent.parent / "saved_models"


class FlowPreprocessor:
    """
    Preprocess live flow features for ML inference.

    Uses the LabelEncoders and StandardScaler fitted during training
    (saved by NSLKDDLoader.preprocess with fit=True).
    """

    def __init__(self, models_dir: Optional[Path] = None) -> None:
        self.models_dir = models_dir or SAVE_DIR
        self.label_encoders: Dict = {}
        self.scaler = None
        self._loaded = False

    def load(self) -> None:
        """Load fitted encoders and scaler from training artifacts."""
        encoder_path = self.models_dir / "preprocessor_encoders.pkl"
        scaler_path = self.models_dir / "preprocessor_scaler.pkl"

        if encoder_path.exists() and scaler_path.exists():
            self.label_encoders = joblib.load(encoder_path)
            self.scaler = joblib.load(scaler_path)
            self._loaded = True
            logger.info("[Preprocessor] Loaded encoders + scaler from %s", self.models_dir)
        else:
            logger.warning(
                "[Preprocessor] Preprocessor artifacts not found. "
                "Run training first to generate encoders/scaler."
            )

    def preprocess_flow(self, flow_features: Dict[str, Any]) -> Optional[np.ndarray]:
        """
        Convert a single flow feature dict to model-ready numpy array.

        Args:
            flow_features: Dict from FeatureExtractor.extract() (63 features)

        Returns:
            1D numpy array of shape (40,) or None if preprocessing fails.
        """
        if not self._loaded:
            logger.error("[Preprocessor] Not loaded. Call load() first.")
            return None

        try:
            # Extract the 40 NSL-KDD features in order
            values = []
            for feat_name in NSL_KDD_FEATURES:
                val = flow_features.get(feat_name, 0)

                if feat_name in CATEGORICAL_FEATURES:
                    # Encode categorical using stored LabelEncoder
                    le = self.label_encoders.get(feat_name)
                    if le is not None:
                        val_str = str(val)
                        if val_str in le.classes_:
                            val = le.transform([val_str])[0]
                        else:
                            val = -1  # Unknown category
                    else:
                        val = 0
                elif isinstance(val, bool):
                    val = int(val)
                else:
                    val = float(val) if val is not None else 0.0

                values.append(val)

            # Convert to numpy and scale
            X = np.array(values, dtype=np.float32).reshape(1, -1)
            X_scaled = self.scaler.transform(X)

            return X_scaled[0]  # Return 1D array

        except Exception as exc:
            logger.error("[Preprocessor] Failed to preprocess flow: %s", exc)
            return None

    def preprocess_batch(self, flows: List[Dict[str, Any]]) -> Optional[np.ndarray]:
        """
        Preprocess a batch of flows.

        Returns:
            2D numpy array of shape (n_flows, 40) or None.
        """
        results = []
        for flow in flows:
            processed = self.preprocess_flow(flow)
            if processed is not None:
                results.append(processed)

        if not results:
            return None

        return np.array(results, dtype=np.float32)
