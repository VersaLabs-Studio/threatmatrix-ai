"""
ThreatMatrix AI — Model Evaluation Framework

Per MASTER_DOC_PART4 §7: Comprehensive evaluation metrics.

Computes: Accuracy, Precision, Recall, F1-Score, AUC-ROC,
Confusion Matrix, Classification Report, per-class metrics.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """
    Evaluate ML model performance with standard IDS metrics.

    Produces:
    - Overall accuracy, precision, recall, F1
    - Per-class metrics
    - Confusion matrix
    - AUC-ROC (multi-class, one-vs-rest)
    """

    def evaluate_binary(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_scores: Optional[np.ndarray] = None,
        model_name: str = "model",
    ) -> Dict[str, Any]:
        """
        Evaluate a binary anomaly detection model (normal vs anomaly).

        Args:
            y_true: Ground truth (0=normal, 1=anomaly)
            y_pred: Predicted labels (0=normal, 1=anomaly)
            y_scores: Anomaly scores for AUC-ROC (optional)
            model_name: Name for logging
        """
        results: Dict[str, Any] = {
            "model": model_name,
            "type": "binary",
            "n_samples": len(y_true),
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
            "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        }

        if y_scores is not None:
            try:
                results["auc_roc"] = float(roc_auc_score(y_true, y_scores))
            except ValueError:
                results["auc_roc"] = None

        logger.info(
            "[Eval] %s — Acc: %.4f | P: %.4f | R: %.4f | F1: %.4f",
            model_name,
            results["accuracy"],
            results["precision"],
            results["recall"],
            results["f1_score"],
        )
        return results

    def evaluate_multiclass(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_proba: Optional[np.ndarray] = None,
        class_names: Optional[List[str]] = None,
        model_name: str = "model",
    ) -> Dict[str, Any]:
        """
        Evaluate a multi-class classification model.

        Args:
            y_true: Ground truth labels (integer encoded)
            y_pred: Predicted labels (integer encoded)
            y_proba: Predicted probabilities for AUC-ROC (optional)
            class_names: Class name list
            model_name: Name for logging
        """
        labels = sorted(np.unique(np.concatenate([y_true, y_pred])))

        results: Dict[str, Any] = {
            "model": model_name,
            "type": "multiclass",
            "n_samples": len(y_true),
            "n_classes": len(labels),
            "class_names": class_names or [str(l) for l in labels],
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
            "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
            "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
            "precision_weighted": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
            "recall_weighted": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
            "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
            "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
            "classification_report": classification_report(
                y_true, y_pred,
                target_names=class_names or [str(l) for l in labels],
                output_dict=True,
                zero_division=0,
            ),
        }

        # AUC-ROC (one-vs-rest)
        if y_proba is not None:
            try:
                results["auc_roc_ovr"] = float(
                    roc_auc_score(y_true, y_proba, multi_class="ovr", average="weighted")
                )
            except ValueError:
                results["auc_roc_ovr"] = None

        logger.info(
            "[Eval] %s — Acc: %.4f | F1(w): %.4f | F1(m): %.4f",
            model_name,
            results["accuracy"],
            results["f1_weighted"],
            results["f1_macro"],
        )
        return results

    def compare_models(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare evaluation results across models."""
        comparison = {
            "models": [],
            "best_accuracy": None,
            "best_f1": None,
        }

        best_acc = 0.0
        best_f1 = 0.0

        for r in results:
            entry = {
                "model": r["model"],
                "accuracy": r["accuracy"],
                "f1": r.get("f1_score") or r.get("f1_weighted", 0),
            }
            comparison["models"].append(entry)

            if entry["accuracy"] > best_acc:
                best_acc = entry["accuracy"]
                comparison["best_accuracy"] = r["model"]
            if entry["f1"] > best_f1:
                best_f1 = entry["f1"]
                comparison["best_f1"] = r["model"]

        return comparison

    def save_results(
        self, results: Dict[str, Any], path: Optional[Path] = None
    ) -> Path:
        """Save evaluation results to JSON."""
        save_dir = Path(__file__).parent.parent / "saved_models" / "eval_results"
        save_dir.mkdir(parents=True, exist_ok=True)

        save_path = path or save_dir / f"{results['model']}_eval.json"
        with open(save_path, "w") as f:
            json.dump(results, f, indent=2, default=str)
        logger.info("[Eval] Results saved to %s", save_path)
        return save_path
