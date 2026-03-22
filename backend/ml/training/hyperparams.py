"""
ThreatMatrix AI — Hyperparameter Configurations

Per MASTER_DOC_PART4 §4.4, §5.2, §6.3

Centralized hyperparameter configs for all three models.
"""

ISOLATION_FOREST_PARAMS = {
    "n_estimators": 200,
    "contamination": 0.05,
    "max_samples": "auto",
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
    "critical": 0.90,
    "high": 0.75,
    "medium": 0.50,
    "low": 0.30,
}
