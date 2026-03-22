"""
ThreatMatrix AI — Feature Extractor

Computes 40+ ML-ready features from completed network flows.
Feature vector maps to NSL-KDD and CICIDS2017 benchmark datasets.

Per MASTER_DOC_PART2 §2.1 and MASTER_DOC_PART4 §3.1-3.2
"""

from __future__ import annotations

import math
import time
from collections import deque
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import numpy as np

from capture.flow_aggregator import FlowBuffer


# ── Service Port Map ──────────────────────────────────────────────

SERVICE_MAP: Dict[int, str] = {
    20: "ftp-data",
    21: "ftp",
    22: "ssh",
    23: "telnet",
    25: "smtp",
    53: "dns",
    67: "dhcp",
    68: "dhcp",
    80: "http",
    110: "pop3",
    111: "rpcbind",
    119: "nntp",
    123: "ntp",
    135: "msrpc",
    137: "netbios-ns",
    138: "netbios-dgm",
    139: "netbios-ssn",
    143: "imap",
    161: "snmp",
    162: "snmp",
    194: "irc",
    389: "ldap",
    443: "https",
    445: "microsoft-ds",
    465: "smtps",
    514: "syslog",
    515: "printer",
    587: "submission",
    631: "ipp",
    636: "ldaps",
    993: "imaps",
    995: "pop3s",
    1080: "socks",
    1433: "mssql",
    1434: "mssql",
    1521: "oracle",
    1723: "pptp",
    2049: "nfs",
    2082: "cpanel",
    2083: "cpanel-ssl",
    3306: "mysql",
    3389: "rdp",
    5060: "sip",
    5432: "postgresql",
    5900: "vnc",
    5984: "couchdb",
    6379: "redis",
    8000: "http-alt",
    8080: "http-proxy",
    8443: "https-alt",
    8888: "http-alt2",
    9090: "wsman",
    9200: "elasticsearch",
    27017: "mongodb",
}

# ── Private IP Ranges ─────────────────────────────────────────────

INTERNAL_PREFIXES = ("10.", "192.168.", "172.16.", "172.17.", "172.18.",
                     "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
                     "172.24.", "172.25.", "172.26.", "172.27.", "172.28.",
                     "172.29.", "172.30.", "172.31.", "127.")


# ── Connection Tracker ────────────────────────────────────────────

@dataclass
class ConnectionRecord:
    """Minimal record for time-window features."""
    timestamp: float
    dst_ip: str
    dst_port: int
    service: str
    flag: str  # SF, S0, REJ, etc.


class ConnectionTracker:
    """
    Tracks recent connections for NSL-KDD time-based and host-based features.

    Per MASTER_DOC_PART4 §3.1:
    - Time features: 2-second window of connections to same host
    - Host features: 100-connection window to same destination
    """

    def __init__(self, time_window: float = 2.0, host_window: int = 100) -> None:
        self.time_window = time_window
        self.host_window = host_window
        self._history: deque = deque(maxlen=10000)

    def add_connection(self, record: ConnectionRecord) -> None:
        """Add a completed connection to history."""
        self._history.append(record)

    def get_time_features(self, current: ConnectionRecord) -> Dict[str, float]:
        """Compute NSL-KDD time-based features (2-second window)."""
        cutoff = current.timestamp - self.time_window
        window = [r for r in self._history if r.timestamp >= cutoff]

        same_host = [r for r in window if r.dst_ip == current.dst_ip]
        same_srv = [r for r in window if r.service == current.service]

        count = len(same_host)
        srv_count = len(same_srv)

        # Error rates
        serror = sum(1 for r in same_host if r.flag in ("S0", "S1", "S2", "S3"))
        rerror = sum(1 for r in same_host if r.flag == "REJ")
        srv_serror = sum(1 for r in same_srv if r.flag in ("S0", "S1", "S2", "S3"))
        srv_rerror = sum(1 for r in same_srv if r.flag == "REJ")

        same_srv_count = sum(1 for r in same_host if r.service == current.service)

        return {
            "count": count,
            "srv_count": srv_count,
            "serror_rate": serror / max(count, 1),
            "srv_serror_rate": srv_serror / max(srv_count, 1),
            "rerror_rate": rerror / max(count, 1),
            "srv_rerror_rate": srv_rerror / max(srv_count, 1),
            "same_srv_rate": same_srv_count / max(count, 1),
            "diff_srv_rate": 1.0 - (same_srv_count / max(count, 1)),
        }

    def get_host_features(self, current: ConnectionRecord) -> Dict[str, float]:
        """Compute NSL-KDD host-based features (100-connection window)."""
        recent = list(self._history)[-self.host_window:]

        dst_host = [r for r in recent if r.dst_ip == current.dst_ip]
        dst_host_srv = [r for r in dst_host if r.service == current.service]

        dst_host_count = len(dst_host)
        dst_host_srv_count = len(dst_host_srv)

        serror = sum(1 for r in dst_host if r.flag in ("S0", "S1", "S2", "S3"))
        rerror = sum(1 for r in dst_host if r.flag == "REJ")
        srv_serror = sum(1 for r in dst_host_srv if r.flag in ("S0", "S1", "S2", "S3"))
        srv_rerror = sum(1 for r in dst_host_srv if r.flag == "REJ")

        return {
            "dst_host_count": dst_host_count,
            "dst_host_srv_count": dst_host_srv_count,
            "dst_host_same_srv_rate": dst_host_srv_count / max(dst_host_count, 1),
            "dst_host_diff_srv_rate": 1.0 - (dst_host_srv_count / max(dst_host_count, 1)),
            "dst_host_same_src_port_rate": sum(
                1 for r in dst_host if r.dst_port == current.dst_port
            ) / max(dst_host_count, 1),
            "dst_host_serror_rate": serror / max(dst_host_count, 1),
            "dst_host_srv_serror_rate": srv_serror / max(dst_host_srv_count, 1),
            "dst_host_rerror_rate": rerror / max(dst_host_count, 1),
            "dst_host_srv_rerror_rate": srv_rerror / max(dst_host_srv_count, 1),
            "dst_host_srv_diff_host_rate": 0.0,  # Requires cross-host tracking
        }


# ── Feature Extractor ─────────────────────────────────────────────

class FeatureExtractor:
    """
    Extract ML-ready feature vectors from completed FlowBuffer objects.

    Produces 41+ features across categories:
    - NSL-KDD Basic (9): duration, protocol_type, service, flag, src_bytes,
      dst_bytes, land, wrong_fragment, urgent
    - NSL-KDD Content (13): hot, num_failed_logins, logged_in, etc.
    - NSL-KDD Time-based (8): count, srv_count, serror_rate, etc.
    - NSL-KDD Host-based (10): dst_host_count, dst_host_srv_count, etc.
    - Extended (12+): total_bytes, byte_ratio, entropy, timing, etc.
    """

    def __init__(self, tracker: Optional[ConnectionTracker] = None) -> None:
        self.tracker = tracker or ConnectionTracker()

    def extract(self, flow: FlowBuffer) -> Dict[str, Any]:
        """Extract all features from a completed flow."""
        features: Dict[str, Any] = {}

        # ── Basic Features ────────────────────────────────────────
        features["duration"] = round(flow.duration, 6)
        features["protocol_type"] = self._protocol_name(flow.key.protocol)
        features["service"] = self._service_name(flow.key.dst_port)
        features["flag"] = self._tcp_flag_status(flow)

        # ── Volume Features ───────────────────────────────────────
        src_bytes = flow.src_bytes
        dst_bytes = flow.dst_bytes
        total_bytes = src_bytes + dst_bytes
        features["src_bytes"] = src_bytes
        features["dst_bytes"] = dst_bytes

        # ── NSL-KDD Compatibility Features ────────────────────────
        # Land attack detection
        features["land"] = (
            flow.key.src_ip == flow.key.dst_ip
            and flow.key.src_port == flow.key.dst_port
            and flow.key.src_port != 0
        )

        # Wrong fragments (approximated from IP layer)
        features["wrong_fragment"] = 0

        # Urgent packets (mapped from urg_count)
        features["urgent"] = flow.urg_count

        # ── Content Features (approximated — no DPI) ─────────────
        # These require application-layer inspection not available from
        # Scapy flow-level aggregation. Set to 0 per standard practice.
        features["hot"] = 0
        features["num_failed_logins"] = 0
        features["logged_in"] = 1 if (flow.syn_count > 0 and flow.ack_count > 0) else 0
        features["num_compromised"] = 0
        features["root_shell"] = 0
        features["su_attempted"] = 0
        features["num_root"] = 0
        features["num_file_creations"] = 0
        features["num_shells"] = 0
        features["num_access_files"] = 0
        features["is_host_login"] = 0
        features["is_guest_login"] = 0

        # ── Time & Host Features (via ConnectionTracker) ──────────
        conn_record = ConnectionRecord(
            timestamp=time.time(),
            dst_ip=flow.key.dst_ip,
            dst_port=flow.key.dst_port,
            service=features["service"],
            flag=features["flag"],
        )

        time_feats = self.tracker.get_time_features(conn_record)
        host_feats = self.tracker.get_host_features(conn_record)
        features.update(time_feats)
        features.update(host_feats)

        # Register this flow in tracker history
        self.tracker.add_connection(conn_record)

        # ── Extended Volume ───────────────────────────────────────
        features["total_bytes"] = total_bytes
        features["byte_ratio"] = round(src_bytes / total_bytes, 6) if total_bytes > 0 else 0.5

        # ── Packet Features ───────────────────────────────────────
        src_packets = flow.src_packets
        dst_packets = flow.dst_packets
        total_packets = src_packets + dst_packets
        features["src_packets"] = src_packets
        features["dst_packets"] = dst_packets
        features["total_packets"] = total_packets
        features["packet_ratio"] = round(src_packets / total_packets, 6) if total_packets > 0 else 0.5

        # ── Timing Features ───────────────────────────────────────
        iats = flow.inter_arrival_times
        if iats:
            iat_array = np.array(iats, dtype=np.float64)
            features["mean_iat"] = round(float(np.mean(iat_array)), 6)
            features["std_iat"] = round(float(np.std(iat_array)), 6)
            features["min_iat"] = round(float(np.min(iat_array)), 6)
            features["max_iat"] = round(float(np.max(iat_array)), 6)
        else:
            features["mean_iat"] = 0.0
            features["std_iat"] = 0.0
            features["min_iat"] = 0.0
            features["max_iat"] = 0.0

        # ── TCP Flag Counts ───────────────────────────────────────
        features["syn_count"] = flow.syn_count
        features["ack_count"] = flow.ack_count
        features["fin_count"] = flow.fin_count
        features["rst_count"] = flow.rst_count
        features["psh_count"] = flow.psh_count
        features["urg_count"] = flow.urg_count

        # ── Payload Features ──────────────────────────────────────
        features["payload_entropy"] = round(self._shannon_entropy(flow.payload_bytes), 6)
        if flow.payload_sizes:
            features["mean_payload_size"] = round(float(np.mean(flow.payload_sizes)), 6)
        else:
            features["mean_payload_size"] = 0.0
        features["has_payload"] = len(flow.payload_bytes) > 0

        # ── Derived Features ──────────────────────────────────────
        duration = max(flow.duration, 0.001)
        features["packets_per_second"] = round(total_packets / duration, 6)
        features["bytes_per_packet"] = round(total_bytes / max(total_packets, 1), 6)
        features["bytes_per_second"] = round(total_bytes / duration, 6)

        # ── Behavioral Features ───────────────────────────────────
        features["is_internal"] = self._is_internal(flow.key.src_ip)
        features["port_class"] = self._classify_port(flow.key.dst_port)

        return features

    def feature_names(self) -> List[str]:
        """Return ordered list of all feature names (NSL-KDD compatible + extended)."""
        return [
            # NSL-KDD Basic (9)
            "duration", "protocol_type", "service", "flag",
            "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent",
            # NSL-KDD Content (13)
            "hot", "num_failed_logins", "logged_in", "num_compromised",
            "root_shell", "su_attempted", "num_root", "num_file_creations",
            "num_shells", "num_access_files", "is_host_login", "is_guest_login",
            # NSL-KDD Time-based (8) — requires ConnectionTracker
            "count", "srv_count", "serror_rate", "srv_serror_rate",
            "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate",
            # NSL-KDD Host-based (10) — requires ConnectionTracker
            "dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate",
            "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
            "dst_host_serror_rate", "dst_host_srv_serror_rate",
            "dst_host_rerror_rate", "dst_host_srv_rerror_rate",
            "dst_host_srv_diff_host_rate",
            # Extended features (CICIDS2017 compatible)
            "total_bytes", "byte_ratio",
            "src_packets", "dst_packets", "total_packets", "packet_ratio",
            "mean_iat", "std_iat", "min_iat", "max_iat",
            "syn_count", "ack_count", "fin_count", "rst_count", "psh_count", "urg_count",
            "payload_entropy", "mean_payload_size", "has_payload",
            "packets_per_second", "bytes_per_packet", "bytes_per_second",
            "is_internal", "port_class",
        ]

    # ── Private Helpers ────────────────────────────────────────────

    @staticmethod
    def _protocol_name(proto: int) -> str:
        """Map protocol number to name."""
        return {1: "icmp", 6: "tcp", 17: "udp"}.get(proto, "other")

    @staticmethod
    def _service_name(port: int) -> str:
        """Map destination port to service name."""
        return SERVICE_MAP.get(port, "other")

    @staticmethod
    def _tcp_flag_status(flow: FlowBuffer) -> str:
        """
        Determine connection status flag (NSL-KDD style).
        SF = normal close, S0 = SYN without response, REJ = rejected,
        OTH = other, etc.
        """
        if flow.key.protocol == 17:  # UDP
            return "SF" if flow.total_packets > 0 else "OTH"
        if flow.key.protocol == 1:  # ICMP
            return "OTH"

        # TCP analysis
        if flow.fin_count > 0:
            return "SF"  # Normal close
        if flow.rst_count > 0:
            return "RSTR"  # Reset
        if flow.syn_count > 0 and flow.ack_count == 0:
            return "S0"  # SYN sent, no reply
        if flow.syn_count > 0 and flow.ack_count > 0:
            return "S1"  # Connection established
        if flow.syn_count == 0 and flow.ack_count > 0:
            return "OTH"  # No SYN seen
        return "OTH"

    @staticmethod
    def _shannon_entropy(data: bytes) -> float:
        """Calculate Shannon entropy of byte data."""
        if not data:
            return 0.0

        byte_counts: Dict[int, int] = {}
        for byte in data:
            byte_counts[byte] = byte_counts.get(byte, 0) + 1

        length = len(data)
        entropy = 0.0
        for count in byte_counts.values():
            probability = count / length
            if probability > 0:
                entropy -= probability * math.log2(probability)

        return entropy

    @staticmethod
    def _is_internal(ip: str) -> bool:
        """Check if IP address is internal/private."""
        return ip.startswith(INTERNAL_PREFIXES)

    @staticmethod
    def _classify_port(port: int) -> str:
        """Classify port range."""
        if port <= 0:
            return "none"
        if port < 1024:
            return "well_known"
        if port < 49152:
            return "registered"
        return "dynamic"
