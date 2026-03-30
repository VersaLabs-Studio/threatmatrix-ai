"""
ThreatMatrix AI — CICIDS2017 Dataset Loader

Per MASTER_DOC_PART4 §3: Secondary benchmark dataset for IDS model validation.
Provides academic credibility through multi-dataset evaluation.

CICIDS2017 Details:
  - Source: Canadian Institute for Cybersecurity (UNB)
  - URL: https://www.unb.ca/cic/datasets/ids-2017.html
  - Size: ~6.5 GB (full), usable with CSV subset
  - Format: CSV with 78 flow features + 1 label column
  - Labels: BENIGN, DoS Hulk, DDoS, PortScan, Bot, Infiltration,
           FTP-Patator, SSH-Patator, DoS Slowhttptest, DoS GoldenEye,
           DoS Slowloris, Heartbleed, Web Attack, Brute Force

Feature Mapping:
  CICIDS2017 has 78 features. We map the closest analogues to the
  NSL-KDD feature space for cross-dataset model validation.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)

# CICIDS2017 numeric columns to extract (in order)
CICIDS_NUMERIC_COLUMNS: List[str] = [
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Fwd Packet Length Max",
    "Fwd Packet Length Min",
    "Fwd Packet Length Mean",
    "Fwd Packet Length Std",
    "Bwd Packet Length Max",
    "Bwd Packet Length Min",
    "Bwd Packet Length Mean",
    "Bwd Packet Length Std",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Flow IAT Std",
    "Flow IAT Max",
    "Flow IAT Min",
    "Fwd IAT Total",
    "Fwd IAT Mean",
    "Fwd IAT Std",
    "Fwd IAT Max",
    "Fwd IAT Min",
    "Bwd IAT Total",
    "Bwd IAT Mean",
    "Bwd IAT Std",
    "Bwd IAT Max",
    "Bwd IAT Min",
    "Fwd PSH Flags",
    "Bwd PSH Flags",
    "Fwd URG Flags",
    "Bwd URG Flags",
    "Fwd Header Length",
    "Bwd Header Length",
    "Fwd Packets/s",
    "Bwd Packets/s",
    "Min Packet Length",
    "Max Packet Length",
    "Packet Length Mean",
    "Packet Length Std",
    "Packet Length Variance",
    "FIN Flag Count",
    "SYN Flag Count",
    "RST Flag Count",
    "PSH Flag Count",
    "ACK Flag Count",
    "URG Flag Count",
    "CWE Flag Count",
    "ECE Flag Count",
    "Down/Up Ratio",
    "Average Packet Size",
    "Avg Fwd Segment Size",
    "Avg Bwd Segment Size",
    "Fwd Header Length.1",
    "Fwd Avg Bytes/Bulk",
    "Fwd Avg Packets/Bulk",
    "Fwd Avg Bulk Rate",
    "Bwd Avg Bytes/Bulk",
    "Bwd Avg Packets/Bulk",
    "Bwd Avg Bulk Rate",
    "Subflow Fwd Packets",
    "Subflow Fwd Bytes",
    "Subflow Bwd Packets",
    "Subflow Bwd Bytes",
    "Init_Win_bytes_forward",
    "Init_Win_bytes_backward",
    "act_data_pkt_fwd",
    "min_seg_size_forward",
    "Active Mean",
    "Active Std",
    "Active Max",
    "Active Min",
    "Idle Mean",
    "Idle Std",
    "Idle Max",
    "Idle Min",
]

# CICIDS2017 attack labels → ThreatMatrix attack categories
CICIDS_ATTACK_CATEGORIES: Dict[str, str] = {
    "BENIGN": "normal",
    # DoS
    "DoS Hulk": "dos",
    "DoS GoldenEye": "dos",
    "DoS Slowloris": "dos",
    "DoS Slowhttptest": "dos",
    "DDoS": "dos",
    # Probe / Port Scan
    "PortScan": "probe",
    "Bot": "probe",
    # Infiltration
    "Infiltration": "u2r",
    "Heartbleed": "u2r",
    # Brute Force
    "FTP-Patator": "r2l",
    "SSH-Patator": "r2l",
    # Web Attacks
    "Web Attack - Brute Force": "r2l",
    "Web Attack - XSS": "r2l",
    "Web Attack - Sql Injection": "r2l",
}

DATASET_DIR = Path(__file__).parent.parent / "saved_models" / "datasets"


class CICIDS2017Loader:
    """
    Load and preprocess the CICIDS2017 dataset for model validation.

    Per MASTER_DOC_PART4 §3: Secondary dataset for academic credibility.
    Maps CICIDS2017 features to a numeric feature space for cross-dataset
    evaluation of the ensemble model.

    Usage:
        loader = CICIDS2017Loader()
        df = loader.load_csvs("ml/datasets/cicids2017/")
        X, y, feature_names = loader.preprocess(df)
        # Feed X to models for validation
    """

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self.data_dir = data_dir or DATASET_DIR / "cicids2017"
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []

    def load_csvs(self, csv_dir: Optional[str] = None) -> pd.DataFrame:
        """
        Load CICIDS2017 CSV files from a directory.

        CICIDS2017 distributes data across multiple CSVs (one per day):
          - Monday-WorkingHours.pcap_ISCX.csv
          - Tuesday-WorkingHours.pcap_ISCX.csv
          - Wednesday-workingHours.pcap_ISCX.csv
          - Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv
          - Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv
          - Friday-WorkingHours-Morning.pcap_ISCX.csv
          - Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv
          - Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv

        Also supports Zenodo V2 single combined CSV file.

        Args:
            csv_dir: Directory containing CICIDS2017 CSV files.

        Returns:
            Combined DataFrame with all loaded CSVs.
        """
        data_path = Path(csv_dir) if csv_dir else self.data_dir
        if not data_path.exists():
            raise FileNotFoundError(
                f"CICIDS2017 data directory not found: {data_path}\n"
                f"Download from: https://www.unb.ca/cic/datasets/ids-2017.html"
            )

        csv_files = sorted(data_path.glob("*.csv"))
        if not csv_files:
            raise FileNotFoundError(
                f"No CSV files found in {data_path}\n"
                f"Extract CICIDS2017 CSVs to this directory."
            )

        frames: List[pd.DataFrame] = []
        for csv_path in csv_files:
            try:
                # Check file size - use chunked reading for large files (>500MB)
                file_size_mb = csv_path.stat().st_size / (1024 * 1024)
                
                if file_size_mb > 500:
                    logger.info(
                        "Loading large file %s (%.1f MB) with chunked reading...",
                        csv_path.name, file_size_mb,
                    )
                    # Use chunked reading for large files
                    chunk_size = 100_000  # Read 100k rows at a time
                    chunks = []
                    for chunk in pd.read_csv(csv_path, chunksize=chunk_size, low_memory=False):
                        chunks.append(chunk)
                    df = pd.concat(chunks, ignore_index=True)
                else:
                    # Use standard reading for smaller files
                    df = pd.read_csv(csv_path, low_memory=False)
                
                logger.info(
                    "Loaded %s: %d records, %d columns",
                    csv_path.name, len(df), len(df.columns),
                )
                frames.append(df)
            except Exception as e:
                logger.warning("Failed to load %s: %s", csv_path.name, e)
                # Try with Python engine as fallback
                try:
                    logger.info("Retrying %s with Python engine...", csv_path.name)
                    df = pd.read_csv(csv_path, engine='python', low_memory=False)
                    logger.info(
                        "Loaded %s with Python engine: %d records, %d columns",
                        csv_path.name, len(df), len(df.columns),
                    )
                    frames.append(df)
                except Exception as e2:
                    logger.error("Failed to load %s with Python engine: %s", csv_path.name, e2)

        if not frames:
            raise ValueError("No CICIDS2017 CSVs could be loaded")

        combined = pd.concat(frames, ignore_index=True)
        logger.info(
            "Combined CICIDS2017: %d records, %d columns",
            len(combined), len(combined.columns),
        )
        return combined

    def preprocess(
        self,
        df: pd.DataFrame,
        fit: bool = True,
    ) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Preprocess CICIDS2017 data for model evaluation.

        Steps:
        1. Clean: remove inf/NaN, duplicates
        2. Extract numeric features
        3. Map labels to attack categories
        4. Encode labels
        5. Scale features

        Args:
            df: Raw CICIDS2017 DataFrame.
            fit: If True, fit encoders/scaler. If False, transform only.

        Returns:
            (X, y, feature_names) — NumPy arrays for model evaluation.
        """
        df = df.copy()

        # 1. Clean data
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.dropna()

        # Remove duplicate rows
        n_before = len(df)
        df = df.drop_duplicates()
        n_after = len(df)
        logger.info("Cleaned: removed %d duplicate/NaN rows", n_before - n_after)

        # 2. Extract label column
        label_col = None
        for candidate in ["Label", " Label", "label"]:
            if candidate in df.columns:
                label_col = candidate
                break

        if label_col is None:
            raise ValueError(
                f"No label column found. Columns: {list(df.columns[:5])}..."
            )

        # 3. Map labels to categories
        labels_raw = df[label_col].astype(str).str.strip()
        categories = labels_raw.map(CICIDS_ATTACK_CATEGORIES).fillna("unknown")
        df["attack_category"] = categories

        n_unknown = (categories == "unknown").sum()
        if n_unknown > 0:
            logger.warning(
                "Dropping %d rows with unknown labels: %s",
                n_unknown,
                labels_raw[categories == "unknown"].unique()[:10],
            )
            df = df[df["attack_category"] != "unknown"]

        # 4. Extract numeric features
        X_df = pd.DataFrame(index=df.index)
        for col in CICIDS_NUMERIC_COLUMNS:
            if col in df.columns:
                X_df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
            else:
                X_df[col] = 0

        # 5. Encode target labels
        y_raw = df["attack_category"]
        if fit:
            self.label_encoders["target"] = LabelEncoder()
            y = self.label_encoders["target"].fit_transform(y_raw)
        else:
            y = self.label_encoders["target"].transform(y_raw)

        # 6. Scale features
        X_values = X_df.values.astype(np.float32)
        if fit:
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X_values)
        else:
            X_scaled = self.scaler.transform(X_values)

        self.feature_names = list(X_df.columns)
        class_names = list(self.label_encoders["target"].classes_)

        logger.info(
            "Preprocessed CICIDS2017: X=%s, y=%s, classes=%s",
            X_scaled.shape, y.shape, class_names,
        )

        return X_scaled, y, self.feature_names

    def get_class_names(self) -> List[str]:
        """Get ordered list of attack category names."""
        if "target" in self.label_encoders:
            return list(self.label_encoders["target"].classes_)
        return []

    def get_label_distribution(self, y: np.ndarray) -> Dict[str, int]:
        """Get class distribution summary."""
        class_names = self.get_class_names()
        unique, counts = np.unique(y, return_counts=True)
        return {
            class_names[i] if i < len(class_names) else str(i): int(c)
            for i, c in zip(unique, counts)
        }


def validate_ensemble_on_cicids2017(
    csv_dir: Optional[str] = None,
    output_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Validate the ThreatMatrix ensemble against CICIDS2017.

    Loads CICIDS2017 data, preprocesses it, runs through the trained
    ensemble in batches, and reports accuracy/F1/AUC-ROC.

    Args:
        csv_dir: Path to CICIDS2017 CSV directory.
        output_path: Where to save validation results JSON.

    Returns:
        Evaluation results dict.
    """
    import time
    from ml.training.evaluate import ModelEvaluator
    from ml.inference.model_manager import ModelManager

    logger.info("=" * 60)
    logger.info("CICIDS2017 VALIDATION — Cross-Dataset Evaluation")
    logger.info("=" * 60)

    # Load and preprocess
    t0 = time.time()
    loader = CICIDS2017Loader()
    df = loader.load_csvs(csv_dir)
    X, y, feature_names = loader.preprocess(df, fit=True)
    class_names = loader.get_class_names()
    logger.info(
        "CICIDS2017 loaded: %d samples, %d features, classes=%s (%.1fs)",
        X.shape[0], X.shape[1], class_names, time.time() - t0,
    )

    # Load trained models
    manager = ModelManager()
    manager.load_all()

    evaluator = ModelEvaluator()
    results: Dict[str, Any] = {
        "dataset": "CICIDS2017",
        "n_samples": int(X.shape[0]),
        "n_features": int(X.shape[1]),
        "class_names": class_names,
        "label_distribution": loader.get_label_distribution(y),
    }

    # Binary evaluation (normal vs anomaly)
    normal_idx = class_names.index("normal") if "normal" in class_names else 0
    y_binary = (y != normal_idx).astype(int)

    # Score with ensemble in batches to limit peak RAM
    try:
        batch_size = 50_000
        n_samples = X.shape[0]
        all_composite: list[float] = []
        t_score = time.time()

        for start in range(0, n_samples, batch_size):
            end = min(start + batch_size, n_samples)
            batch = X[start:end]

            scores = manager.score_flows(batch)
            all_composite.extend(r.get("composite_score", 0) for r in scores)

            pct = end * 100 // n_samples
            elapsed = time.time() - t_score
            logger.info(
                "[CICIDS2017] Scored %d / %d (%d%%) — %.1fs elapsed",
                end, n_samples, pct, elapsed,
            )

        composite = np.array(all_composite)
        ensemble_preds = (composite >= 0.30).astype(int)

        ensemble_eval = evaluator.evaluate_binary(
            y_true=y_binary,
            y_pred=ensemble_preds,
            y_scores=composite,
            model_name="ensemble_cicids2017",
        )
        results["ensemble"] = ensemble_eval
        logger.info(
            "[CICIDS2017] Ensemble — Acc: %.4f | F1: %.4f | AUC: %.4f",
            ensemble_eval.get("accuracy", 0),
            ensemble_eval.get("f1_score", 0),
            ensemble_eval.get("auc_roc", 0),
        )
    except Exception as e:
        logger.error("[CICIDS2017] Ensemble evaluation failed: %s", e)
        results["ensemble"] = {"error": str(e)}

    results["evaluation_time_seconds"] = round(time.time() - t0, 1)

    # Save results
    save_dir = output_path or Path(__file__).parent.parent / "saved_models" / "eval_results"
    save_dir.mkdir(parents=True, exist_ok=True)
    result_path = save_dir / "cicids2017_validation.json"
    with open(result_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    logger.info("[CICIDS2017] Validation results saved to %s", result_path)

    logger.info("=" * 60)
    logger.info("CICIDS2017 VALIDATION COMPLETE")
    logger.info("=" * 60)

    return results
