"""
ThreatMatrix AI — Hyperparameter Configurations

Per MASTER_DOC_PART4 §4.4, §5.2, §6.3

Centralized hyperparameter configs for all three models.

Day 14 Update: Applied tuned IF parameters from best_params.json
  - n_estimators: 100 (verified via tuning)
  - contamination: 0.10 (was 0.05, +0.05)
  - max_samples: 1024 (was "auto", now explicit)
  Expected improvement: IF Accuracy 79.68%→82.54%, IF F1 78.75%→83.03%
"""

ISOLATION_FOREST_PARAMS = {
    "n_estimators": 100,       # Tuned: verified via Day 13 hyperparameter search
    "contamination": 0.10,     # Tuned: was 0.05, increased for better recall
    "max_samples": 1024,       # Tuned: was "auto", now explicit for consistency
    "max_features": 1.0,
    "bootstrap": False,
    "random_state": 42,
    "n_jobs": -1,
}

RANDOM_FOREST_PARAMS = {
    "n_estimators": 300,
    "max_depth": 30,
    "min_samples_split": 5,
    "min_samples_leaf": 2,
    "max_features": "sqrt",
    "class_weight": "balanced",
    "criterion": "gini",
    "random_state": 42,
    "n_jobs": -1,
}

AUTOENCODER_PARAMS = {
    "encoder_layers": [64, 32, 16],
    "decoder_layers": [32, 64],
    "activation": "relu",
    "output_activation": "sigmoid",
    "dropout_rate": 0.2,
    "learning_rate": 0.001,
    "batch_size": 256,
    "epochs": 100,
    "patience": 10,
    "validation_split": 0.15,
}

ENSEMBLE_WEIGHTS = {
    "isolation_forest": 0.30,    # W_IF per PART4 §1.2
    "random_forest": 0.45,       # W_RF per PART4 §1.2
    "autoencoder": 0.25,         # W_AE per PART4 §1.2
}

ALERT_THRESHOLDS = {
    "critical": 0.65,
    "high":     0.55,
    "medium":   0.45,
    "low":      0.35,
}
