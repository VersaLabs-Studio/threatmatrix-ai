"""
ThreatMatrix AI — Feature Extractor

Computes 40+ ML-ready features from completed network flows.
Feature vector maps to NSL-KDD and CICIDS2017 benchmark datasets.

Per MASTER_DOC_PART2 §2.1 and MASTER_DOC_PART4 §3.1-3.2
"""

from __future__ import annotations

import math
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


class FeatureExtractor:
    """
    Extract ML-ready feature vectors from completed FlowBuffer objects.

    Produces 40+ features across categories:
    - Basic (4): duration, protocol_type, service, flag
    - Volume (4): src_bytes, dst_bytes, total_bytes, byte_ratio
    - Packet (4): src_packets, dst_packets, total_packets, packet_ratio
    - Timing (4): mean_iat, std_iat, min_iat, max_iat
    - TCP Flags (6): syn_count, ack_count, fin_count, rst_count, psh_count, urg_count
    - Payload (3): payload_entropy, mean_payload_size, has_payload
    - Derived (3+): packets_per_second, bytes_per_packet, connection_density
    - Behavioral (2): is_internal, port_class
    """

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
        """Return ordered list of feature names for ML pipeline."""
        return [
            "duration", "protocol_type", "service", "flag",
            "src_bytes", "dst_bytes", "total_bytes", "byte_ratio",
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