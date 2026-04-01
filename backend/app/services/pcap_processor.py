"""
ThreatMatrix AI — PCAP File Processor

Per MASTER_DOC_PART3 §8 (Forensics Lab):
  Upload .pcap/.pcapng → extract flows → ML scoring → store results.

Per MASTER_DOC_PART5 Week 5:
  "Upload and analyze historical traffic"

Pipeline:
  1. Read PCAP with Scapy
  2. Group packets into flows (5-tuple)
  3. Extract features per flow (NSL-KDD compatible)
  4. Score with ML ensemble
  5. Persist to network_flows (source='pcap')
  6. Create alerts for anomalous flows
  7. Update pcap_uploads record
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)

# ── Service Port Map (mirrors capture/feature_extractor.py) ───────
SERVICE_MAP: Dict[int, str] = {
    20: "ftp-data", 21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp",
    53: "dns", 67: "dhcp", 68: "dhcp", 80: "http", 110: "pop3",
    111: "rpcbind", 119: "nntp", 123: "ntp", 135: "msrpc",
    137: "netbios-ns", 138: "netbios-dgm", 139: "netbios-ssn",
    143: "imap", 161: "snmp", 162: "snmp", 194: "irc", 389: "ldap",
    443: "https", 445: "microsoft-ds", 465: "smtps", 514: "syslog",
    515: "printer", 587: "submission", 631: "ipp", 636: "ldaps",
    993: "imaps", 995: "pop3s", 1080: "socks", 1433: "mssql",
    1434: "mssql", 1521: "oracle", 1723: "pptp", 2049: "nfs",
    2082: "cpanel", 2083: "cpanel-ssl", 3306: "mysql", 3389: "rdp",
    5060: "sip", 5432: "postgresql", 5900: "vnc", 5984: "couchdb",
    6379: "redis", 8000: "http-alt", 8080: "http-proxy",
    8443: "https-alt", 8888: "http-alt2", 9090: "wsman",
    9200: "elasticsearch", 27017: "mongodb",
}

INTERNAL_PREFIXES = (
    "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
    "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
    "127.",
)


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

            # 7. Create alerts for anomalous flows (via Redis → AlertEngine)
            if anomalies:
                await self._publish_alerts(anomalies)

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

        Produces the 40 NSL-KDD features that FlowPreprocessor expects,
        matching the format from capture/feature_extractor.py.

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

        # Count TCP flags from packets
        syn_count = 0
        ack_count = 0
        fin_count = 0
        rst_count = 0
        psh_count = 0
        urg_count = 0
        payload_bytes = b""

        for pkt in flow["packets"]:
            try:
                # TCP flags
                if hasattr(pkt, "flags"):
                    flags = int(pkt.flags)
                    if flags & 0x02: syn_count += 1   # SYN
                    if flags & 0x10: ack_count += 1   # ACK
                    if flags & 0x01: fin_count += 1   # FIN
                    if flags & 0x04: rst_count += 1   # RST
                    if flags & 0x08: psh_count += 1   # PSH
                    if flags & 0x20: urg_count += 1   # URG
                # Payload
                if hasattr(pkt, "payload"):
                    raw = bytes(pkt.payload)
                    if raw:
                        payload_bytes += raw[:256]  # Cap for entropy calc
            except Exception:
                continue

        # Map protocol number to name
        protocol = flow.get("protocol", 0)
        protocol_name = {1: "icmp", 6: "tcp", 17: "udp"}.get(protocol, "other")

        # Map destination port to service name
        dst_port = flow.get("dst_port", 0)
        service = SERVICE_MAP.get(dst_port, "other")

        # Determine TCP flag status (NSL-KDD style)
        if protocol == 17:  # UDP
            flag_status = "SF" if n_pkts > 0 else "OTH"
        elif protocol == 1:  # ICMP
            flag_status = "OTH"
        else:  # TCP
            if fin_count > 0:
                flag_status = "SF"
            elif rst_count > 0:
                flag_status = "RSTR"
            elif syn_count > 0 and ack_count == 0:
                flag_status = "S0"
            elif syn_count > 0 and ack_count > 0:
                flag_status = "S1"
            else:
                flag_status = "OTH"

        # Shannon entropy of payload
        entropy = 0.0
        if payload_bytes:
            byte_counts: Dict[int, int] = {}
            for b in payload_bytes:
                byte_counts[b] = byte_counts.get(b, 0) + 1
            length = len(payload_bytes)
            for count in byte_counts.values():
                p = count / length
                if p > 0:
                    entropy -= p * math.log2(p)

        # Bidirectional byte split (approximate)
        src_bytes = total_bytes // 2
        dst_bytes = total_bytes - src_bytes

        # Is internal?
        is_internal = flow.get("src_ip", "").startswith(INTERNAL_PREFIXES)

        return {
            # NSL-KDD Basic (9) — exact names for FlowPreprocessor
            "duration": round(duration, 6),
            "protocol_type": protocol_name,
            "service": service,
            "flag": flag_status,
            "src_bytes": src_bytes,
            "dst_bytes": dst_bytes,
            "land": (flow.get("src_ip") == flow.get("dst_ip")
                     and flow.get("src_port") == flow.get("dst_port")
                     and flow.get("src_port", 0) != 0),
            "wrong_fragment": 0,
            "urgent": urg_count,

            # NSL-KDD Content (13) — approximated without DPI
            "hot": 0,
            "num_failed_logins": 0,
            "logged_in": 1 if (syn_count > 0 and ack_count > 0) else 0,
            "num_compromised": 0,
            "root_shell": 0,
            "su_attempted": 0,
            "num_root": 0,
            "num_file_creations": 0,
            "num_shells": 0,
            "num_access_files": 0,
            "is_host_login": 0,
            "is_guest_login": 0,

            # NSL-KDD Time-based (8) — single-flow approximation
            "count": n_pkts,
            "srv_count": n_pkts,
            "serror_rate": 1.0 if (syn_count > 0 and ack_count == 0) else 0.0,
            "srv_serror_rate": 1.0 if (syn_count > 0 and ack_count == 0) else 0.0,
            "rerror_rate": 1.0 if rst_count > 0 else 0.0,
            "srv_rerror_rate": 1.0 if rst_count > 0 else 0.0,
            "same_srv_rate": 1.0,
            "diff_srv_rate": 0.0,

            # NSL-KDD Host-based (10) — single-flow approximation
            "dst_host_count": 1,
            "dst_host_srv_count": 1,
            "dst_host_same_srv_rate": 1.0,
            "dst_host_diff_srv_rate": 0.0,
            "dst_host_same_src_port_rate": 1.0,
            "dst_host_serror_rate": 1.0 if (syn_count > 0 and ack_count == 0) else 0.0,
            "dst_host_srv_serror_rate": 1.0 if (syn_count > 0 and ack_count == 0) else 0.0,
            "dst_host_rerror_rate": 1.0 if rst_count > 0 else 0.0,
            "dst_host_srv_rerror_rate": 1.0 if rst_count > 0 else 0.0,
            "dst_host_srv_diff_host_rate": 0.0,

            # Extra metadata (not in NSL-KDD, used for DB/alerts)
            "src_ip": flow.get("src_ip", "0.0.0.0"),
            "dst_ip": flow.get("dst_ip", "0.0.0.0"),
            "src_port": flow.get("src_port", 0),
            "dst_port": dst_port,
            "protocol": protocol,
            "total_bytes": total_bytes,
            "total_packets": n_pkts,
            "packets_per_second": round(n_pkts / duration, 6),
            "bytes_per_packet": round(total_bytes / max(n_pkts, 1), 6),
            "avg_pkt_size": round(pkt_mean, 2),
            "min_pkt_size": pkt_min,
            "max_pkt_size": pkt_max,
            "syn_count": syn_count,
            "ack_count": ack_count,
            "fin_count": fin_count,
            "rst_count": rst_count,
            "psh_count": psh_count,
            "payload_entropy": round(entropy, 6),
            "is_internal": is_internal,
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

            logger.info("[PCAP] ML imports successful, loading preprocessor...")
            preprocessor = FlowPreprocessor()
            preprocessor.load()

            if not preprocessor._loaded:
                logger.error(
                    "[PCAP] Preprocessor failed to load. "
                    "Check ml/saved_models/preprocessor_encoders.pkl and preprocessor_scaler.pkl exist."
                )
                return self._set_defaults(flow_features)

            logger.info("[PCAP] Preprocessor loaded, loading model manager...")
            manager = ModelManager()
            manager.load_all()
            logger.info("[PCAP] Model manager loaded, scoring %d flows...", len(flow_features))

            scored_count = 0
            anomaly_count = 0
            for i, features in enumerate(flow_features):
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
                            scored_count += 1
                            if r["is_anomaly"]:
                                anomaly_count += 1
                            if i < 3:  # Log first 3 for debugging
                                logger.info(
                                    "[PCAP] Flow %d: score=%.3f anomaly=%s label=%s "
                                    "src=%s:%d → dst=%s:%d proto=%s",
                                    i, r["composite_score"], r["is_anomaly"],
                                    r.get("label", "?"),
                                    features.get("src_ip", "?"),
                                    features.get("src_port", 0),
                                    features.get("dst_ip", "?"),
                                    features.get("dst_port", 0),
                                    features.get("protocol_type", "?"),
                                )
                            continue

                    # Preprocessing returned None
                    if i < 3:
                        logger.warning(
                            "[PCAP] Flow %d preprocessing returned None. "
                            "Features: protocol_type=%s service=%s flag=%s",
                            i,
                            features.get("protocol_type", "MISSING"),
                            features.get("service", "MISSING"),
                            features.get("flag", "MISSING"),
                        )
                    features["anomaly_score"] = 0.0
                    features["is_anomaly"] = False
                    features["label"] = None
                    features["severity"] = "none"

                except Exception as e:
                    logger.error("[PCAP] Scoring error for flow %d: %s", i, e, exc_info=True)
                    features["anomaly_score"] = 0.0
                    features["is_anomaly"] = False
                    features["label"] = None
                    features["severity"] = "none"

            logger.info(
                "[PCAP] Scoring complete: %d/%d scored, %d anomalies",
                scored_count, len(flow_features), anomaly_count,
            )

        except ImportError as e:
            logger.error(
                "[PCAP] ML models not available for scoring: %s — "
                "flows will be stored without anomaly scores. "
                "Check ml/inference/ modules and saved_models/ directory.",
                e,
            )
            return self._set_defaults(flow_features)
        except Exception as e:
            logger.error("[PCAP] Unexpected error during scoring: %s", e, exc_info=True)
            return self._set_defaults(flow_features)

        return flow_features

    @staticmethod
    def _set_defaults(flow_features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Set default (non-anomaly) values for all flows."""
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

    # ── Alert Creation ─────────────────────────────────────────

    async def _publish_alerts(self, anomalies: List[Dict[str, Any]]) -> None:
        """
        Create alerts directly in the database for anomalous PCAP flows.

        The live pipeline publishes to Redis alerts:live channel which
        AlertEngine consumes. For PCAP uploads we insert directly into
        the alerts table since the flow was not routed through Redis.

        Args:
            anomalies: List of scored flow dicts where is_anomaly=True.
        """
        alert_count = 0
        now = datetime.now(timezone.utc)

        # Severity thresholds per MASTER_DOC_PART4 §1.2
        def score_to_severity(score: float) -> str:
            if score >= 0.90:
                return "critical"
            elif score >= 0.75:
                return "high"
            elif score >= 0.50:
                return "medium"
            elif score >= 0.30:
                return "low"
            return "info"

        # Category mapping from ML label
        LABEL_TO_CATEGORY = {
            "dos": "ddos",
            "probe": "port_scan",
            "r2l": "unauthorized_access",
            "u2r": "privilege_escalation",
            "normal": "anomaly",
        }

        async with async_session() as session:
            for flow in anomalies:
                try:
                    composite_score = flow.get("anomaly_score", 0.0)
                    severity = score_to_severity(composite_score)
                    label = flow.get("label", "unknown")
                    category = LABEL_TO_CATEGORY.get(label, "anomaly")

                    # Generate unique alert reference
                    timestamp = now.strftime("%Y%m%d%H%M%S")
                    unique_suffix = uuid.uuid4().hex[:8].upper()
                    alert_ref = f"TM-{timestamp}-{unique_suffix}"

                    title = f"{severity.upper()} — {category.replace('_', ' ')} detected (PCAP)"
                    src_ip = flow.get("src_ip", "unknown")
                    dst_ip = flow.get("dst_ip", "unknown")

                    await session.execute(
                        text("""
                            INSERT INTO alerts (
                                id, alert_id, severity, title, description,
                                category, source_ip, dest_ip, confidence,
                                status, ml_model,
                                composite_score, if_score, rf_score, ae_score,
                                created_at, updated_at
                            ) VALUES (
                                :id, :alert_id, :severity, :title, :description,
                                :category, :source_ip, :dest_ip, :confidence,
                                'open', 'ensemble',
                                :composite_score, :if_score, :rf_score, :ae_score,
                                :created_at, :updated_at
                            )
                        """),
                        {
                            "id": str(uuid4()),
                            "alert_id": alert_ref,
                            "severity": severity,
                            "title": title,
                            "description": (
                                f"Anomalous flow detected in PCAP analysis: "
                                f"{src_ip}:{flow.get('src_port', 0)} → "
                                f"{dst_ip}:{flow.get('dst_port', 0)} "
                                f"(protocol={flow.get('protocol_type', 'unknown')}, "
                                f"score={composite_score:.3f})"
                            ),
                            "category": category,
                            "source_ip": src_ip,
                            "dest_ip": dst_ip,
                            "confidence": composite_score,
                            "composite_score": composite_score,
                            "if_score": flow.get("if_score", 0),
                            "rf_score": flow.get("rf_score", 0),
                            "ae_score": flow.get("ae_score", 0),
                            "created_at": now,
                            "updated_at": now,
                        },
                    )
                    alert_count += 1

                except Exception as e:
                    logger.error("[PCAP] Failed to create alert: %s", e)
                    continue

            await session.commit()

        if alert_count > 0:
            logger.info("[PCAP] Created %d alerts from anomalous flows", alert_count)

            # Fire-and-forget LLM narratives for alerts
            try:
                asyncio.create_task(
                    self._generate_pcap_narratives(anomalies)
                )
            except Exception:
                pass  # Non-critical

    async def _generate_pcap_narratives(
        self, anomalies: List[Dict[str, Any]]
    ) -> None:
        """Generate LLM narratives for PCAP alerts (fire-and-forget)."""
        try:
            from app.services.llm_gateway import LLMGateway

            gateway = LLMGateway()
            for flow in anomalies[:5]:  # Limit to 5 to avoid budget waste
                try:
                    alert_data = {
                        "severity": flow.get("severity", "medium"),
                        "category": flow.get("label", "anomaly"),
                        "source_ip": flow.get("src_ip", "unknown"),
                        "dest_ip": flow.get("dst_ip", "unknown"),
                        "confidence": flow.get("anomaly_score", 0.0),
                        "composite_score": flow.get("anomaly_score", 0.0),
                        "if_score": flow.get("if_score", 0.0),
                        "rf_label": flow.get("label", "unknown"),
                        "rf_confidence": flow.get("rf_score", 0.0),
                        "ae_score": flow.get("ae_score", 0.0),
                    }
                    result = await gateway.analyze_alert(alert_data)
                    narrative = result.get("content", "")
                    if narrative and not narrative.startswith("["):
                        # Update the most recent alert with matching IPs
                        async with async_session() as session:
                            await session.execute(
                                text("""
                                    UPDATE alerts SET ai_narrative = :narrative, updated_at = :now
                                    WHERE source_ip = :src AND dest_ip = :dst
                                    AND ai_narrative IS NULL
                                    ORDER BY created_at DESC LIMIT 1
                                """),
                                {
                                    "narrative": narrative,
                                    "src": flow.get("src_ip"),
                                    "dst": flow.get("dst_ip"),
                                    "now": datetime.now(timezone.utc),
                                },
                            )
                            await session.commit()
                except Exception:
                    continue

            await gateway.close()
        except Exception as e:
            logger.error("[PCAP] LLM narrative generation failed: %s", e)

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

        # Verify user exists in DB to avoid FK violation in DEV_MODE
        # (mock user IDs from get_current_user don't exist in users table)
        verified_user_id: Optional[str] = None
        if user_id:
            try:
                async with async_session() as session:
                    result = await session.execute(
                        text("SELECT 1 FROM users WHERE id = :uid"),
                        {"uid": user_id},
                    )
                    if result.scalar():
                        verified_user_id = user_id
            except Exception:
                pass  # FK will be NULL

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
                    "uploaded_by": verified_user_id,
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
