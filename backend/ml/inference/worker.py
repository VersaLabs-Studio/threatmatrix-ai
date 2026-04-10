"""
ThreatMatrix AI — ML Inference Worker

Per MASTER_DOC_PART4 §8: Real-time inference pipeline.

Subscribes to 'flows:live' Redis channel.
For each flow:
  1. Deserialize flow JSON
  2. Preprocess features (40 NSL-KDD features, scaled)
  3. Run through all 3 models
  4. Ensemble scoring → composite score + severity
  5. Publish score to ml:scored channel
  6. If anomalous: publish alert to alerts:live channel
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import numpy as np
import redis.asyncio as redis

from ml.inference.model_manager import ModelManager
from ml.inference.preprocessor import FlowPreprocessor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class MLWorker:
    """
    Real-time ML inference worker.

    Subscribes to Redis flows:live channel and scores
    every flow using the three-model ensemble.
    """

    # Map RF label → alert category per MASTER_DOC_PART4 §5.3
    CATEGORY_MAP = {
        "dos": "ddos",
        "probe": "port_scan",
        "r2l": "unauthorized_access",
        "u2r": "privilege_escalation",
    }

    def __init__(
        self,
        redis_url: str = "redis://redis:6379",
        flow_channel: str = "flows:live",
        score_channel: str = "ml:scored",
        alert_channel: str = "alerts:live",
        ml_live_channel: str = "ml:live",
    ) -> None:
        self.redis_url = redis_url
        self.flow_channel = flow_channel
        self.score_channel = score_channel
        self.alert_channel = alert_channel
        self.ml_live_channel = ml_live_channel

        self.model_manager = ModelManager()
        self.preprocessor = FlowPreprocessor()
        self._redis: Optional[redis.Redis] = None
        self._publisher: Optional[redis.Redis] = None
        self._running = False

        # Stats
        self.stats: Dict[str, Any] = {
            "flows_scored": 0,
            "anomalies_detected": 0,
            "alerts_created": 0,
            "errors": 0,
            "start_time": 0.0,
            "avg_inference_ms": 0.0,
        }

    async def start(self) -> None:
        """Initialize and start the worker."""
        logger.info("[Worker] Starting ML inference worker...")

        # Load models
        status = self.model_manager.load_all()
        if not any(status.values()):
            logger.error("[Worker] No ML models available. Cannot start inference.")
            raise RuntimeError("No ML models loaded")

        logger.info("[Worker] Models loaded: %s", status)

        # Load preprocessor
        self.preprocessor.load()
        if not self.preprocessor._loaded:
            logger.error("[Worker] Preprocessor not loaded. Run training first.")
            raise RuntimeError("Preprocessor artifacts not found")

        # Connect to Redis
        self._redis = redis.from_url(
            self.redis_url, decode_responses=True,
            socket_connect_timeout=5, socket_keepalive=True,
        )
        self._publisher = redis.from_url(
            self.redis_url, decode_responses=True,
        )

        await self._redis.ping()
        logger.info("[Worker] Connected to Redis at %s", self.redis_url)

        self._running = True
        self.stats["start_time"] = time.time()

        # Subscribe and process
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(self.flow_channel)
        logger.info("[Worker] Subscribed to channel: %s", self.flow_channel)

        try:
            async for message in pubsub.listen():
                if not self._running:
                    break
                if message["type"] != "message":
                    continue

                try:
                    await self._process_message(message["data"])
                except Exception as exc:
                    self.stats["errors"] += 1
                    logger.error("[Worker] Error processing flow: %s", exc)

        except asyncio.CancelledError:
            logger.info("[Worker] Cancelled — shutting down")
        finally:
            await pubsub.unsubscribe(self.flow_channel)
            await self._cleanup()

    async def _process_message(self, data: str) -> None:
        """Process a single flow message from Redis."""
        t_start = time.time()

        # Parse flow
        msg = json.loads(data)
        if msg.get("event") != "new_flow":
            return

        flow_data = msg.get("payload", {})
        features = flow_data.get("features", {})
        flow_id = flow_data.get("id")

        if not features:
            return

        # Preprocess
        X = self.preprocessor.preprocess_flow(features)
        if X is None:
            return

        X_batch = X.reshape(1, -1)
        t_preprocess = time.time()

        # Score each model individually for latency tracking
        if_scores = self.model_manager.if_model.score(X_batch) if self.model_manager.if_model._is_fitted else np.zeros(len(X_batch))
        t_if = time.time()

        rf_preds = (
            self.model_manager.rf_model.predict_with_confidence(X_batch)
            if self.model_manager.rf_model._is_fitted
            else [{"label": "unknown", "confidence": 0.0, "is_anomaly": False,
                   "class_probabilities": {}} for _ in range(len(X_batch))]
        )
        t_rf = time.time()

        ae_scores = self.model_manager.ae_model.score(X_batch) if self.model_manager.ae_model._is_fitted else np.zeros(len(X_batch))
        t_ae = time.time()

        # Ensemble scoring
        results = self.model_manager.scorer.classify(if_scores, rf_preds, ae_scores)
        t_ensemble = time.time()

        if not results:
            return

        result = results[0]
        composite_score = result["composite_score"]
        is_anomaly = result["is_anomaly"]
        severity = result["severity"]
        label = result.get("label", "unknown")
        agreement = result.get("model_agreement", "none")
        rf_conf = result.get("rf_confidence", 0.0)

        # ── SEVERITY ESCALATION (directly in worker for reliability) ──
        # Score floors by attack type + model agreement.
        # This ensures diverse severity regardless of ensemble output.
        _FLOORS = {
            "dos":   {"unanimous": 0.88, "majority": 0.72, "single": 0.55},
            "u2r":   {"unanimous": 0.92, "majority": 0.78, "single": 0.60},
            "r2l":   {"unanimous": 0.80, "majority": 0.68, "single": 0.50},
            "probe": {"unanimous": 0.75, "majority": 0.65, "single": 0.48},
        }
        _SEV_THRESHOLDS = {"critical": 0.80, "high": 0.65, "medium": 0.45, "low": 0.30}

        original_score = composite_score
        original_severity = severity

        if is_anomaly and label in _FLOORS:
            floor_map = _FLOORS[label]
            floor = floor_map.get(agreement, 0.0)
            composite_score = max(composite_score, floor)

            # RF confidence boost
            if rf_conf >= 0.75:
                composite_score = min(composite_score + 0.08, 1.0)

            # Recompute severity from escalated score
            if composite_score >= _SEV_THRESHOLDS["critical"]:
                severity = "critical"
            elif composite_score >= _SEV_THRESHOLDS["high"]:
                severity = "high"
            elif composite_score >= _SEV_THRESHOLDS["medium"]:
                severity = "medium"
            elif composite_score >= _SEV_THRESHOLDS["low"]:
                severity = "low"
            else:
                severity = "none"

            # Update result dict so downstream (alerts, websocket) uses new values
            result["composite_score"] = composite_score
            result["severity"] = severity
            is_anomaly = severity != "none"
            result["is_anomaly"] = is_anomaly

        self.stats["flows_scored"] += 1

        # Log per-model scores for anomalous flows (with escalation visibility)
        if is_anomaly:
            logger.info(
                "[Worker] Flow %s | IF=%.3f RF=%.2f AE=%.3f | "
                "raw=%.3f floor=%.3f | %s->%s | agree=%s",
                flow_id,
                result.get("if_score", 0),
                rf_conf,
                result.get("ae_score", 0),
                original_score,
                composite_score,
                original_severity.upper(),
                severity.upper(),
                agreement,
            )

        # Publish scored flow to ml:scored channel
        score_update = {
            "event": "flow_scored",
            "payload": {
                "flow_id": flow_id,
                "anomaly_score": composite_score,
                "is_anomaly": is_anomaly,
                "severity": severity,
                "label": result["label"],
                "model_agreement": result["model_agreement"],
                "if_score": result["if_score"],
                "ae_score": result["ae_score"],
                "rf_label": result["rf_label"],
                "rf_confidence": result["rf_confidence"],
            },
        }

        await self._publisher.publish(self.score_channel, json.dumps(score_update))

        # If anomalous, publish alert
        if is_anomaly and severity in ("critical", "high", "medium"):
            self.stats["anomalies_detected"] += 1
            await self._create_alert(flow_data, result)

        # Publish anomaly_detected to ml:live for WebSocket broadcasting
        # (per MASTER_DOC_PART2 §5.2: ml:live → anomaly_detected)
        if is_anomaly:
            anomaly_event = {
                "event": "anomaly_detected",
                "payload": {
                    "flow_id": flow_id,
                    "composite_score": result["composite_score"],
                    "severity": severity,
                    "category": self.CATEGORY_MAP.get(result["label"], "anomaly"),
                    "source_ip": flow_data.get("src_ip", "unknown"),
                    "dest_ip": flow_data.get("dst_ip", "unknown"),
                    "if_score": result["if_score"],
                    "rf_confidence": result["rf_confidence"],
                    "ae_score": result["ae_score"],
                    "label": result["label"],
                    "model_agreement": result["model_agreement"],
                },
            }
            await self._publisher.publish(
                self.ml_live_channel, json.dumps(anomaly_event)
            )

        # Stats
        elapsed_ms = (time.time() - t_start) * 1000
        self.stats["avg_inference_ms"] = (
            (self.stats["avg_inference_ms"] * (self.stats["flows_scored"] - 1) + elapsed_ms)
            / self.stats["flows_scored"]
        )

        # Publish latency metrics for anomalies to ml:metrics channel
        if is_anomaly and severity in ("critical", "high", "medium"):
            try:
                latency_payload = {
                    "event": "latency",
                    "payload": {
                        "flow_id": flow_id,
                        "preprocess_ms": round((t_preprocess - t_start) * 1000, 2),
                        "if_ms": round((t_if - t_preprocess) * 1000, 2),
                        "rf_ms": round((t_rf - t_if) * 1000, 2),
                        "ae_ms": round((t_ae - t_rf) * 1000, 2),
                        "ensemble_ms": round((t_ensemble - t_ae) * 1000, 2),
                        "total_ms": round(elapsed_ms, 2),
                        "severity": severity,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                }
                await self._publisher.publish("ml:metrics", json.dumps(latency_payload))
            except Exception as e:
                logger.warning("[Worker] Failed to publish latency metrics: %s", e)

        if self.stats["flows_scored"] % 100 == 0:
            logger.info(
                "[Worker] Stats: %d scored | %d anomalies | %d alerts | %.1fms avg",
                self.stats["flows_scored"],
                self.stats["anomalies_detected"],
                self.stats["alerts_created"],
                self.stats["avg_inference_ms"],
            )

    async def _create_alert(self, flow_data: Dict, result: Dict) -> None:
        """Create and publish an alert for an anomalous flow."""
        t_alert_start = time.time()
        alert = {
            "event": "new_alert",
            "payload": {
                "severity": result["severity"],
                "category": self.CATEGORY_MAP.get(result["label"], "anomaly"),
                "title": f"{result['severity'].upper()} — {result['label']} detected",
                "description": (
                    f"ML ensemble detected {result['label']} activity. "
                    f"Composite score: {result['composite_score']:.2f}. "
                    f"Model agreement: {result['model_agreement']}."
                ),
                "source_ip": flow_data.get("src_ip", "unknown"),
                "dest_ip": flow_data.get("dst_ip", "unknown"),
                "composite_score": result["composite_score"],
                "model_agreement": result["model_agreement"],
                "rf_label": result["rf_label"],
                "rf_confidence": result["rf_confidence"],
                "if_score": result["if_score"],
                "ae_score": result["ae_score"],
                "flow_id": flow_data.get("id"),
            },
        }

        await self._publisher.publish(self.alert_channel, json.dumps(alert))
        self.stats["alerts_created"] += 1
        t_alert_end = time.time()

        logger.info(
            "[Worker] ALERT: %s — %s (score=%.2f, agreement=%s, latency=%.1fms)",
            result["severity"].upper(),
            result["label"],
            result["composite_score"],
            result["model_agreement"],
            (t_alert_end - t_alert_start) * 1000,
        )

    async def _cleanup(self) -> None:
        """Clean up connections."""
        self._running = False
        if self._redis:
            await self._redis.close()
        if self._publisher:
            await self._publisher.close()
        logger.info("[Worker] Shut down. Final stats: %s", self.stats)

    def get_stats(self) -> Dict[str, Any]:
        """Return current worker statistics."""
        stats = self.stats.copy()
        if stats["start_time"] > 0:
            stats["uptime_seconds"] = time.time() - stats["start_time"]
        return stats


async def main() -> None:
    """Entry point for standalone worker execution."""
    redis_url = os.environ.get("REDIS_URL", "redis://redis:6379")
    worker = MLWorker(redis_url=redis_url)
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())
