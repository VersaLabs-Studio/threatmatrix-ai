"""
ThreatMatrix AI — PCAP File Processor

Per MASTER_DOC_PART3 §8 (Forensics Lab):
  Upload .pcap/.pcapng → extract flows → ML scoring → store results.

Per MASTER_DOC_PART5 Week 5:
  "Upload and analyze historical traffic"

Pipeline:
  1. Read PCAP with Scapy
  2. Group packets into flows (5-tuple)
  3. Extract features per flow
  4. Score with ML ensemble
  5. Persist to network_flows (source='pcap')
  6. Update pcap_uploads record
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)


class PcapProcessor:
    """Process uploaded PCAP files for forensic analysis."""

    def __init__(self) -> None:
        self.stats: Dict[str, Any] = {
            "packets_read": 0,
            "flows_extracted": 0,
            "anomalies_found": 0,
        }

    async def process(
        self,
        pcap_path: str,
        upload_id: str,
    ) -> Dict[str, Any]:
        """
        Process a PCAP file end-to-end.

        Args:
            pcap_path: Path to the uploaded PCAP file.
            upload_id: UUID of the pcap_uploads record.

        Returns:
            Processing results dict with packets_read, flows_extracted,
            anomalies_found.
        """
        logger.info(
            "[PCAP] Processing: %s (upload_id=%s)", pcap_path, upload_id
        )

        try:
            # 1. Read PCAP
            packets = self._read_pcap(pcap_path)
            self.stats["packets_read"] = len(packets)

            if not packets:
                logger.warning("[PCAP] No packets read from %s", pcap_path)
                await self._update_upload_record(upload_id, status="error")
                return self.stats

            # 2. Group into flows
            flows = self._extract_flows(packets)
            self.stats["flows_extracted"] = len(flows)

            # 3. Extract features per flow
            flow_features = [self._extract_features(f) for f in flows]

            # 4. Score with ML ensemble
            scored_flows = await self._score_flows(flow_features)

            # 5. Count anomalies
            anomalies = [f for f in scored_flows if f.get("is_anomaly")]
            self.stats["anomalies_found"] = len(anomalies)

            # 6. Persist to database
            await self._persist_flows(scored_flows, upload_id)
            await self._update_upload_record(upload_id, status="complete")

            logger.info(
                "[PCAP] Complete: %d packets, %d flows, %d anomalies",
                self.stats["packets_read"],
                self.stats["flows_extracted"],
                self.stats["anomalies_found"],
            )
            return self.stats

        except Exception as e:
            logger.error("[PCAP] Processing failed: %s", e, exc_info=True)
            await self._update_upload_record(upload_id, status="error")
            raise

    # ── Packet Reading ─────────────────────────────────────────

    def _read_pcap(self, pcap_path: str) -> list:
        """
        Read packets from PCAP file using Scapy.

        Args:
            pcap_path: Path to the PCAP file.

        Returns:
            List of Scapy packet objects. Empty list if Scapy unavailable.
        """
        try:
            from scapy.all import rdpcap

            packets = rdpcap(pcap_path)
            logger.info(
                "[PCAP] Read %d packets from %s", len(packets), pcap_path
            )
            return list(packets)
        except ImportError:
            logger.error(
                "[PCAP] Scapy not available — install with: pip install scapy"
            )
            return []
        except Exception as e:
            logger.error("[PCAP] Failed to read %s: %s", pcap_path, e)
            return []

    # ── Flow Extraction ────────────────────────────────────────

    def _extract_flows(self, packets: list) -> List[Dict[str, Any]]:
        """
        Group packets into flows by 5-tuple (src_ip:src_port → dst_ip:dst_port/proto).

        Args:
            packets: List of Scapy packet objects.

        Returns:
            List of flow dicts with packet lists and metadata.
        """
        flows: Dict[str, Dict[str, Any]] = {}

        for pkt in packets:
            try:
                # Extract IP layer
                ip_layer = self._get_ip_layer(pkt)
                if ip_layer is None:
                    continue

                src_ip = str(getattr(ip_layer, "src", "0.0.0.0"))
                dst_ip = str(getattr(ip_layer, "dst", "0.0.0.0"))
                proto = int(getattr(ip_layer, "proto", 0))

                # Extract transport ports
                src_port, dst_port = self._get_ports(pkt, ip_layer)

                # Build 5-tuple key
                key = f"{src_ip}:{src_port}-{dst_ip}:{dst_port}-{proto}"

                pkt_time = float(getattr(pkt, "time", 0))
                pkt_len = len(pkt)

                if key not in flows:
                    flows[key] = {
                        "src_ip": src_ip,
                        "dst_ip": dst_ip,
                        "src_port": src_port,
                        "dst_port": dst_port,
                        "protocol": proto,
                        "packets": [],
                        "total_bytes": 0,
                        "start_time": pkt_time,
                        "end_time": pkt_time,
                    }

                flows[key]["packets"].append(pkt)
                flows[key]["total_bytes"] += pkt_len
                flows[key]["end_time"] = pkt_time

            except Exception:
                # Skip malformed packets
                continue

        logger.info(
            "[PCAP] Extracted %d flows from %d packets",
            len(flows),
            len(packets),
        )
        return list(flows.values())

    @staticmethod
    def _get_ip_layer(pkt: Any) -> Optional[Any]:
        """Extract IP layer from a packet, handling various Scapy versions."""
        if hasattr(pkt, "ip") and pkt.ip is not None:
            return pkt.ip
        # Fallback: check for IP in layers
        try:
            from scapy.layers.inet import IP

            return pkt[IP] if IP in pkt else None
        except (ImportError, Exception):
            # Last resort: check payload chain
            layer = pkt
            while layer:
                if hasattr(layer, "src") and hasattr(layer, "dst"):
                    if hasattr(layer, "proto"):
                        return layer
                layer = getattr(layer, "payload", None)
            return None

    @staticmethod
    def _get_ports(pkt: Any, ip_layer: Any) -> tuple[int, int]:
        """Extract source and destination ports from transport layer."""
        src_port = 0
        dst_port = 0

        # Direct attribute access (Scapy often exposes these at pkt level)
        if hasattr(pkt, "sport") and hasattr(pkt, "dport"):
            try:
                src_port = int(pkt.sport)
                dst_port = int(pkt.dport)
                return src_port, dst_port
            except (TypeError, ValueError):
                pass

        # Try transport layer from IP payload
        if hasattr(ip_layer, "payload"):
            transport = ip_layer.payload
            if hasattr(transport, "sport"):
                try:
                    src_port = int(transport.sport)
                    dst_port = int(transport.dport)
                except (TypeError, ValueError):
                    pass

        return src_port, dst_port

    # ── Feature Extraction ─────────────────────────────────────

    def _extract_features(self, flow: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract ML-ready features from a flow.

        Computes basic statistics from the flow metadata.
        The ML preprocessor (FlowPreprocessor) maps these to the
        full 63-feature vector used by the ensemble.

        Args:
            flow: Flow dict with packets, timing, and byte counts.

        Returns:
            Feature dict compatible with FlowPreprocessor.preprocess_flow().
        """
        n_pkts = len(flow["packets"])
        duration = flow.get("end_time", 0) - flow.get("start_time", 0)
        duration = max(duration, 0.001)  # Avoid division by zero
        total_bytes = flow.get("total_bytes", 0)

        # Compute per-packet statistics
        pkt_sizes = [len(p) for p in flow["packets"]]
        pkt_mean = sum(pkt_sizes) / max(len(pkt_sizes), 1)
        pkt_min = min(pkt_sizes) if pkt_sizes else 0
        pkt_max = max(pkt_sizes) if pkt_sizes else 0

        return {
            "src_ip": flow["src_ip"],
            "dst_ip": flow["dst_ip"],
            "src_port": flow["src_port"],
            "dst_port": flow["dst_port"],
            "protocol": flow["protocol"],
            "duration": duration,
            "total_bytes": total_bytes,
            "total_packets": n_pkts,
            "src_bytes": total_bytes // 2,  # Approximation without direction
            "dst_bytes": total_bytes - total_bytes // 2,
            "packets_per_second": n_pkts / duration,
            "bytes_per_packet": total_bytes / max(n_pkts, 1),
            "avg_pkt_size": pkt_mean,
            "min_pkt_size": pkt_min,
            "max_pkt_size": pkt_max,
        }

    # ── ML Scoring ─────────────────────────────────────────────

    async def _score_flows(
        self, flow_features: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Score flows through the ML ensemble.

        Uses FlowPreprocessor + ModelManager to score each flow.
        Falls back gracefully if ML models are not available.

        Args:
            flow_features: List of feature dicts from _extract_features().

        Returns:
            Same list with anomaly_score, is_anomaly, label, severity added.
        """
        if not flow_features:
            return []

        try:
            from ml.inference.model_manager import ModelManager
            from ml.inference.preprocessor import FlowPreprocessor
            import numpy as np

            preprocessor = FlowPreprocessor()
            preprocessor.load()

            manager = ModelManager()
            manager.load_all()

            for features in flow_features:
                try:
                    X = preprocessor.preprocess_flow(features)
                    if X is not None:
                        results = manager.score_flows(X.reshape(1, -1))
                        if results:
                            r = results[0]
                            features["anomaly_score"] = r["composite_score"]
                            features["is_anomaly"] = r["is_anomaly"]
                            features["label"] = r.get("label", "unknown")
                            features["severity"] = r.get("severity", "none")
                            features["if_score"] = r.get("if_score", 0)
                            features["rf_score"] = r.get("rf_confidence", 0)
                            features["ae_score"] = r.get("ae_score", 0)
                            continue

                    # Preprocessing returned None — skip scoring
                    features["anomaly_score"] = 0.0
                    features["is_anomaly"] = False
                    features["label"] = None
                    features["severity"] = "none"

                except Exception as e:
                    logger.debug("[PCAP] Scoring error for flow: %s", e)
                    features["anomaly_score"] = 0.0
                    features["is_anomaly"] = False
                    features["label"] = None
                    features["severity"] = "none"

        except ImportError:
            logger.warning(
                "[PCAP] ML models not available for scoring — "
                "flows will be stored without anomaly scores"
            )
            for f in flow_features:
                f["anomaly_score"] = 0.0
                f["is_anomaly"] = False
                f["label"] = None
                f["severity"] = "none"

        return flow_features

    # ── Database Persistence ───────────────────────────────────

    async def _persist_flows(
        self, flows: List[Dict[str, Any]], upload_id: str
    ) -> None:
        """
        Persist scored flows to the network_flows table.

        Each flow is inserted with source='pcap' for forensic tracking.

        Args:
            flows: Scored flow dicts.
            upload_id: UUID of the originating pcap_uploads record.
        """
        if not flows:
            return

        now = datetime.now(timezone.utc)

        async with async_session() as session:
            for flow in flows:
                import json as _json

                # Build features JSON (exclude metadata fields)
                feature_data = {
                    k: v
                    for k, v in flow.items()
                    if k
                    not in (
                        "src_ip",
                        "dst_ip",
                        "src_port",
                        "dst_port",
                        "protocol",
                        "duration",
                        "total_bytes",
                        "total_packets",
                        "anomaly_score",
                        "is_anomaly",
                        "label",
                        "severity",
                        "packets",  # Don't store raw packets
                    )
                }

                await session.execute(
                    text(
                        """
                        INSERT INTO network_flows (
                            id, timestamp, src_ip, dst_ip, src_port, dst_port,
                            protocol, duration, total_bytes, total_packets,
                            anomaly_score, is_anomaly, label, source, features
                        ) VALUES (
                            :id, :ts, :src_ip, :dst_ip, :src_port, :dst_port,
                            :protocol, :duration, :total_bytes, :total_packets,
                            :anomaly_score, :is_anomaly, :label, 'pcap', :features
                        )
                        """
                    ),
                    {
                        "id": str(uuid4()),
                        "ts": now,
                        "src_ip": flow.get("src_ip", "0.0.0.0"),
                        "dst_ip": flow.get("dst_ip", "0.0.0.0"),
                        "src_port": flow.get("src_port", 0),
                        "dst_port": flow.get("dst_port", 0),
                        "protocol": flow.get("protocol", 0),
                        "duration": flow.get("duration", 0),
                        "total_bytes": flow.get("total_bytes", 0),
                        "total_packets": flow.get("total_packets", 0),
                        "anomaly_score": flow.get("anomaly_score", 0),
                        "is_anomaly": flow.get("is_anomaly", False),
                        "label": flow.get("label"),
                        "features": _json.dumps(feature_data, default=str),
                    },
                )

            await session.commit()

        logger.info("[PCAP] Persisted %d flows (source=pcap)", len(flows))

    # ── Upload Record Updates ──────────────────────────────────

    async def _update_upload_record(
        self, upload_id: str, status: str = "completed"
    ) -> None:
        """
        Update the pcap_uploads table with processing results.

        Args:
            upload_id: UUID of the pcap_uploads record (as string).
            status: Processing status (completed, error).
        """
        now = datetime.now(timezone.utc)

        async with async_session() as session:
            await session.execute(
                text(
                    """
                    UPDATE pcap_uploads
                    SET status = :status,
                        packets_count = :packets,
                        flows_extracted = :flows,
                        anomalies_found = :anomalies,
                        processed_at = :now,
                        updated_at = :now
                    WHERE id::text = :upload_id
                    """
                ),
                {
                    "status": status,
                    "packets": self.stats["packets_read"],
                    "flows": self.stats["flows_extracted"],
                    "anomalies": self.stats["anomalies_found"],
                    "now": now,
                    "upload_id": upload_id,
                },
            )
            await session.commit()

        logger.info(
            "[PCAP] Upload %s updated: status=%s, packets=%d, flows=%d, anomalies=%d",
            upload_id,
            status,
            self.stats["packets_read"],
            self.stats["flows_extracted"],
            self.stats["anomalies_found"],
        )

    async def create_upload_record(
        self,
        filename: str,
        file_size: int,
        file_path: str,
        user_id: Optional[str] = None,
    ) -> str:
        """
        Create a pcap_uploads record before processing.

        Args:
            filename: Original uploaded filename.
            file_size: Size in bytes.
            file_path: Temporary storage path.
            user_id: Optional user UUID who uploaded the file.

        Returns:
            String UUID of the created upload record.
        """
        upload_id = str(uuid4())
        now = datetime.now(timezone.utc)

        async with async_session() as session:
            await session.execute(
                text(
                    """
                    INSERT INTO pcap_uploads (
                        id, filename, file_size, file_path, status,
                        uploaded_by, created_at, updated_at
                    ) VALUES (
                        :id, :filename, :file_size, :file_path, 'processing',
                        :uploaded_by, :now, :now
                    )
                    """
                ),
                {
                    "id": upload_id,
                    "filename": filename,
                    "file_size": file_size,
                    "file_path": file_path,
                    "uploaded_by": user_id,
                    "now": now,
                },
            )
            await session.commit()

        logger.info(
            "[PCAP] Upload record created: id=%s, file=%s, size=%d",
            upload_id,
            filename,
            file_size,
        )
        return upload_id
