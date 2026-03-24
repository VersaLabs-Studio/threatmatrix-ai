"""
ThreatMatrix AI — Autoencoder Model

Per MASTER_DOC_PART4 §6: Deep learning reconstruction-based anomaly detection.
Trained on NORMAL traffic only — anomalies produce high reconstruction error.

Architecture per §6.2:
- Encoder: Dense(64) → Dense(32) → Dense(16) bottleneck
- Decoder: Dense(32) → Dense(64) → Dense(n_features)
- BatchNormalization + Dropout(0.2) between layers
- Loss: MSE, Optimizer: Adam(lr=0.001)
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np

from ml.training.hyperparams import AUTOENCODER_PARAMS

logger = logging.getLogger(__name__)

SAVE_DIR = Path(__file__).parent.parent / "saved_models"


class AutoencoderModel:
    """
    Autoencoder wrapper for ThreatMatrix AI.

    Training: Fit on normal traffic only (input = target).
    Inference: Measure reconstruction error — high error = anomaly.
    """

    MODEL_NAME = "autoencoder"

    def __init__(self, params: Optional[Dict[str, Any]] = None) -> None:
        self.params = params or AUTOENCODER_PARAMS.copy()
        self.model = None  # type: Any  # tf.keras.Model
        self.threshold: float = 0.0
        self._is_fitted = False
        self._n_features: int = 0

    def _build_model(self, n_features: int) -> Any:
        """Build the autoencoder architecture per PART4 §6.2."""
        import tensorflow as tf
        from tensorflow import keras

        self._n_features = n_features

        encoder_layers = self.params["encoder_layers"]   # [64, 32, 16]
        decoder_layers = self.params["decoder_layers"]    # [32, 64]
        activation = self.params["activation"]            # "relu"
        output_activation = self.params["output_activation"]  # "sigmoid"
        dropout_rate = self.params["dropout_rate"]        # 0.2

        # Encoder
        inputs = keras.Input(shape=(n_features,), name="encoder_input")
        x = inputs

        for i, units in enumerate(encoder_layers[:-1]):
            x = keras.layers.Dense(units, activation=activation, name=f"encoder_{i}")(x)
            x = keras.layers.BatchNormalization(name=f"bn_enc_{i}")(x)
            x = keras.layers.Dropout(dropout_rate, name=f"drop_enc_{i}")(x)

        # Bottleneck (no dropout)
        bottleneck = keras.layers.Dense(
            encoder_layers[-1], activation=activation, name="bottleneck"
        )(x)

        # Decoder
        x = bottleneck
        for i, units in enumerate(decoder_layers):
            x = keras.layers.Dense(units, activation=activation, name=f"decoder_{i}")(x)
            x = keras.layers.BatchNormalization(name=f"bn_dec_{i}")(x)
            x = keras.layers.Dropout(dropout_rate, name=f"drop_dec_{i}")(x)

        # Output — reconstruct input
        outputs = keras.layers.Dense(
            n_features, activation=output_activation, name="reconstruction"
        )(x)

        model = keras.Model(inputs, outputs, name="threatmatrix_autoencoder")
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.params["learning_rate"]),
            loss="mse",
        )

        return model

    def train(self, X_normal: np.ndarray) -> Dict[str, Any]:
        """
        Train on normal traffic only (reconstruction learning).

        Args:
            X_normal: Feature matrix of NORMAL samples only, already scaled.

        Returns:
            Training metadata dict.
        """
        import tensorflow as tf
        from tensorflow import keras

        n_features = X_normal.shape[1]
        logger.info(
            "[AE] Training on %d normal samples with %d features",
            X_normal.shape[0], n_features
        )

        # Build model
        self.model = self._build_model(n_features)
        self.model.summary(print_fn=lambda s: logger.info("[AE] %s", s))

        # Callbacks per PART4 §6.3
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor="val_loss",
                patience=self.params["patience"],
                restore_best_weights=True,
                verbose=1,
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=5,
                verbose=1,
            ),
        ]

        # Train: input = target (reconstruction)
        history = self.model.fit(
            X_normal, X_normal,
            epochs=self.params["epochs"],
            batch_size=self.params["batch_size"],
            validation_split=self.params["validation_split"],
            callbacks=callbacks,
            verbose=1,
        )

        self._is_fitted = True

        # Compute reconstruction errors on training data for threshold
        train_reconstructions = self.model.predict(X_normal, verbose=0)
        train_mse = np.mean(np.power(X_normal - train_reconstructions, 2), axis=1)

        # Threshold: 95th percentile of training reconstruction error (per PART4 §6.3)
        self.threshold = float(np.percentile(train_mse, 95))

        metadata = {
            "model": self.MODEL_NAME,
            "n_samples": X_normal.shape[0],
            "n_features": n_features,
            "params": {k: v for k, v in self.params.items() if not callable(v)},
            "epochs_trained": len(history.history["loss"]),
            "final_train_loss": float(history.history["loss"][-1]),
            "final_val_loss": float(history.history["val_loss"][-1]),
            "threshold_95th": self.threshold,
            "train_mse_mean": float(np.mean(train_mse)),
            "train_mse_std": float(np.std(train_mse)),
            "train_anomaly_rate": float((train_mse > self.threshold).mean()),
        }

        logger.info(
            "[AE] Training complete. Epochs: %d | Loss: %.6f | Val Loss: %.6f | Threshold: %.6f",
            metadata["epochs_trained"],
            metadata["final_train_loss"],
            metadata["final_val_loss"],
            self.threshold,
        )
        return metadata

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomaly labels based on reconstruction error.

        Returns:
            Array of 0 (normal) or 1 (anomaly).
        """
        if not self._is_fitted:
            raise RuntimeError("Model not trained. Call train() first.")

        mse = self._reconstruction_error(X)
        return (mse > self.threshold).astype(int)

    def score(self, X: np.ndarray) -> np.ndarray:
        """
        Compute normalized anomaly scores (0.0 = normal, 1.0 = anomalous).

        Returns:
            Normalized reconstruction error scores.
        """
        if not self._is_fitted:
            raise RuntimeError("Model not trained. Call train() first.")

        mse = self._reconstruction_error(X)
        # Normalize: clip at 2× threshold, then scale to [0, 1]
        max_error = self.threshold * 2
        normalized = np.clip(mse / max_error, 0.0, 1.0)
        return normalized

    def _reconstruction_error(self, X: np.ndarray) -> np.ndarray:
        """Compute per-sample mean squared reconstruction error."""
        reconstructions = self.model.predict(X, verbose=0)
        mse = np.mean(np.power(X - reconstructions, 2), axis=1)
        return mse

    def save(self, path: Optional[Path] = None) -> Path:
        """Save trained model + threshold to disk."""
        if not self._is_fitted:
            raise RuntimeError("Cannot save untrained model.")

        save_dir = path or SAVE_DIR / self.MODEL_NAME
        save_dir.mkdir(parents=True, exist_ok=True)

        # Save Keras model
        model_path = save_dir / "model.keras"
        self.model.save(model_path)

        # Save threshold separately (numpy)
        threshold_path = save_dir / "threshold.npy"
        np.save(threshold_path, np.array([self.threshold, self._n_features]))

        logger.info("[AE] Model saved to %s", save_dir)
        return save_dir

    def load(self, path: Optional[Path] = None) -> None:
        """Load trained model + threshold from disk."""
        import tensorflow as tf
        from tensorflow import keras

        load_dir = path or SAVE_DIR / self.MODEL_NAME
        model_path = load_dir / "model.keras"
        threshold_path = load_dir / "threshold.npy"

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.model = keras.models.load_model(model_path)
        meta = np.load(threshold_path)
        self.threshold = float(meta[0])
        self._n_features = int(meta[1])
        self._is_fitted = True

        logger.info("[AE] Model loaded from %s (threshold=%.6f)", load_dir, self.threshold)
