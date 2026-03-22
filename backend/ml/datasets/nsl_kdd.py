"""
ThreatMatrix AI — NSL-KDD Dataset Loader

Per MASTER_DOC_PART4 §2.1: Primary benchmark dataset for IDS evaluation.
- 125,973 training records + 22,544 test records
- 41 features + 1 label
- 4 attack categories: DoS, Probe, R2L, U2R
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)

# NSL-KDD column names (41 features + 2 labels)
NSL_KDD_COLUMNS = [
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
    "label", "difficulty_level"
]

# Attack type → category mapping
ATTACK_CATEGORIES = {
    "normal": "normal",
    # DoS attacks
    "back": "dos", "land": "dos", "neptune": "dos", "pod": "dos",
    "smurf": "dos", "teardrop": "dos", "mailbomb": "dos",
    "apache2": "dos", "processtable": "dos", "udpstorm": "dos",
    # Probe attacks
    "ipsweep": "probe", "nmap": "probe", "portsweep": "probe",
    "satan": "probe", "mscan": "probe", "saint": "probe",
    # R2L attacks
    "ftp_write": "r2l", "guess_passwd": "r2l", "imap": "r2l",
    "multihop": "r2l", "phf": "r2l", "spy": "r2l",
    "warezclient": "r2l", "warezmaster": "r2l", "snmpgetattack": "r2l",
    "named": "r2l", "xlock": "r2l", "xsnoop": "r2l",
    "sendmail": "r2l", "httptunnel": "r2l", "worm": "r2l",
    "snmpguess": "r2l",
    # U2R attacks
    "buffer_overflow": "u2r", "loadmodule": "u2r", "perl": "u2r",
    "rootkit": "u2r", "xterm": "u2r", "ps": "u2r",
    "sqlattack": "u2r",
}

DATASET_DIR = Path(__file__).parent.parent / "saved_models" / "datasets"


class NSLKDDLoader:
    """
    Load and preprocess the NSL-KDD dataset.

    Per MASTER_DOC_PART4 §2.4, the preparation pipeline:
    1. Load raw data (CSV with column headers)
    2. Handle missing values
    3. Encode categorical features (Label Encoding)
    4. Normalize numerical features (StandardScaler)
    5. Map attack labels → 5-class categories
    6. Stratified train/test split
    """

    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or DATASET_DIR
        self.label_encoders: dict[str, LabelEncoder] = {}
        self.scaler: StandardScaler | None = None
        self.feature_names: list[str] = []

    def load_train(self) -> pd.DataFrame:
        """Load NSL-KDD training set (KDDTrain+.txt)."""
        train_path = self.data_dir / "KDDTrain+.txt"
        if not train_path.exists():
            raise FileNotFoundError(
                f"NSL-KDD training data not found at {train_path}. "
                f"Download from: https://www.unb.ca/cic/datasets/nsl.html"
            )
        df = pd.read_csv(train_path, header=None, names=NSL_KDD_COLUMNS)
        logger.info("Loaded NSL-KDD train set: %d records, %d columns", len(df), len(df.columns))
        return df

    def load_test(self) -> pd.DataFrame:
        """Load NSL-KDD test set (KDDTest+.txt)."""
        test_path = self.data_dir / "KDDTest+.txt"
        if not test_path.exists():
            raise FileNotFoundError(
                f"NSL-KDD test data not found at {test_path}. "
                f"Download from: https://www.unb.ca/cic/datasets/nsl.html"
            )
        df = pd.read_csv(test_path, header=None, names=NSL_KDD_COLUMNS)
        logger.info("Loaded NSL-KDD test set: %d records, %d columns", len(df), len(df.columns))
        return df

    def preprocess(
        self, df: pd.DataFrame, fit: bool = True
    ) -> Tuple[np.ndarray, np.ndarray, list[str]]:
        """
        Full preprocessing pipeline.

        Args:
            df: Raw NSL-KDD DataFrame
            fit: If True, fit encoders/scaler (training). If False, transform only (test).

        Returns:
            (X, y, feature_names) — NumPy arrays ready for model training.
        """
        df = df.copy()

        # 1. Map labels to 5-class categories
        df["label"] = df["label"].str.strip().str.lower()
        df["attack_category"] = df["label"].map(ATTACK_CATEGORIES).fillna("unknown")
        df = df[df["attack_category"] != "unknown"]  # Drop unmapped (rare)

        # 2. Drop difficulty_level (not a feature)
        df = df.drop(columns=["difficulty_level", "label"], errors="ignore")

        # 3. Separate features and target
        y_raw = df["attack_category"]
        X_df = df.drop(columns=["attack_category"])

        # 4. Encode categorical features
        categorical_cols = ["protocol_type", "service", "flag"]
        for col in categorical_cols:
            if fit:
                le = LabelEncoder()
                X_df[col] = le.fit_transform(X_df[col].astype(str))
                self.label_encoders[col] = le
            else:
                le = self.label_encoders[col]
                # Handle unseen labels in test set
                X_df[col] = X_df[col].astype(str).map(
                    lambda x, _le=le: _le.transform([x])[0]
                    if x in _le.classes_ else -1
                )

        # 5. Encode target
        if fit:
            self.label_encoders["target"] = LabelEncoder()
            y = self.label_encoders["target"].fit_transform(y_raw)
        else:
            y = self.label_encoders["target"].transform(y_raw)

        # 6. Store feature names
        self.feature_names = list(X_df.columns)

        # 7. Convert to numpy
        X = X_df.values.astype(np.float32)

        # 8. Scale numerical features
        if fit:
            self.scaler = StandardScaler()
            X = self.scaler.fit_transform(X)
        else:
            X = self.scaler.transform(X)

        logger.info(
            "Preprocessed: X=%s, y=%s, classes=%s",
            X.shape, y.shape,
            list(self.label_encoders["target"].classes_)
        )

        return X, y, self.feature_names

    def get_normal_mask(self, y: np.ndarray) -> np.ndarray:
        """Get boolean mask for normal traffic (for unsupervised training)."""
        normal_idx = list(self.label_encoders["target"].classes_).index("normal")
        return y == normal_idx

    def get_class_names(self) -> list[str]:
        """Get ordered list of class names."""
        return list(self.label_encoders["target"].classes_)
