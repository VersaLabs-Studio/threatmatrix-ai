"""
ThreatMatrix AI — Flow Aggregator

Groups raw packets into bidirectional network flows using 5-tuple keys.
Handles flow lifecycle: creation, update, completion (timeout/FIN/RST).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from capture.config import CaptureConfig


@dataclass(frozen=True)
class FlowKey:
    """5-tuple flow identifier."""

    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: int  # 6=TCP, 17=UDP, 1=ICMP

    def normalize(self) -> FlowKey:
        """
        Normalize to bidirectional key.
        Smaller IP comes first to group both directions of same flow.
        """
        if self.src_ip < self.dst_ip:
            return self
        if self.src_ip > self.dst_ip:
            return FlowKey(
                src_ip=self.dst_ip,
                dst_ip=self.src_ip,
                src_port=self.dst_port,
                dst_port=self.src_port,
                protocol=self.protocol,
            )
        # IPs equal — compare ports
        if self.src_port <= self.dst_port:
            return self
        return FlowKey(
            src_ip=self.dst_ip,
            dst_ip=self.src_ip,
            src_port=self.dst_port,
            dst_port=self.src_port,
            protocol=self.protocol,
        )


@dataclass
class PacketRecord:
    """Minimal packet data extracted from Scapy for flow aggregation."""

    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: int
    length: int
    payload: bytes
    timestamp: float
    flags: int = 0  # TCP flags bitmask


@dataclass
class FlowBuffer:
    """Accumulates packets for a single bidirectional flow."""

    key: FlowKey
    start_time: float
    last_seen: float

    # Packet/byte counters
    src_packets: int = 0
    dst_packets: int = 0
    src_bytes: int = 0
    dst_bytes: int = 0

    # TCP flag counters
    syn_count: int = 0
    ack_count: int = 0
    fin_count: int = 0
    rst_count: int = 0
    psh_count: int = 0
    urg_count: int = 0

    # Inter-arrival times (capped at 50 entries for feature extraction)
    inter_arrival_times: List[float] = field(default_factory=list)
    last_packet_time: Optional[float] = None
    _MAX_IAT_ENTRIES: int = 50

    # Payload tracking (avoid expensive bytes concat)
    payload_total_size: int = 0
    payload_sizes: List[int] = field(default_factory=list)
    # Small sample for entropy calculation (first 256 bytes only)
    payload_entropy_sample: bytes = b""

    @property
    def duration(self) -> float:
        """Flow duration in seconds."""
        return self.last_seen - self.start_time

    @property
    def total_packets(self) -> int:
        return self.src_packets + self.dst_packets

    @property
    def total_bytes(self) -> int:
        return self.src_bytes + self.dst_bytes


class FlowAggregator:
    """
    Aggregates raw packets into bidirectional flows.

    Flow completion triggers:
    - TCP FIN or RST flag
    - Active timeout (flow duration exceeds threshold)
    - Idle timeout (no packets for extended period — handled externally via flush_expired)
    """

    def __init__(self, config: CaptureConfig) -> None:
        self.config = config
        self.flows: Dict[FlowKey, FlowBuffer] = {}

    def add_packet(self, pkt: PacketRecord) -> Optional[FlowBuffer]:
        """
        Add a packet to its corresponding flow buffer.

        Returns:
            FlowBuffer if the flow completed (FIN/RST/active timeout),
            None otherwise.
        """
        flow_key = FlowKey(
            src_ip=pkt.src_ip,
            dst_ip=pkt.dst_ip,
            src_port=pkt.src_port,
            dst_port=pkt.dst_port,
            protocol=pkt.protocol,
        ).normalize()

        current_time = pkt.timestamp

        # Create or retrieve flow buffer
        if flow_key not in self.flows:
            if len(self.flows) >= self.config.max_flows_buffer:
                # Buffer full — force flush oldest flow
                self._evict_oldest()

            self.flows[flow_key] = FlowBuffer(
                key=flow_key,
                start_time=current_time,
                last_seen=current_time,
            )

        flow = self.flows[flow_key]

        # Determine direction relative to normalized key
        is_src = (pkt.src_ip == flow_key.src_ip and pkt.src_port == flow_key.src_port)

        # Update counters
        if is_src:
            flow.src_packets += 1
            flow.src_bytes += pkt.length
        else:
            flow.dst_packets += 1
            flow.dst_bytes += pkt.length

        # Update timestamps
        flow.last_seen = current_time

        # Inter-arrival time (capped at 50 entries)
        if flow.last_packet_time is not None:
            iat = current_time - flow.last_packet_time
            if len(flow.inter_arrival_times) < flow._MAX_IAT_ENTRIES:
                flow.inter_arrival_times.append(iat)
        flow.last_packet_time = current_time

        # TCP flags
        if pkt.protocol == 6:  # TCP
            self._count_tcp_flags(flow, pkt.flags)

        # Payload tracking (no bytes concat — track size only + small entropy sample)
        if pkt.payload:
            flow.payload_total_size += len(pkt.payload)
            flow.payload_sizes.append(len(pkt.payload))
            # Keep first 256 bytes for entropy calculation
            if len(flow.payload_entropy_sample) < 256:
                remaining = 256 - len(flow.payload_entropy_sample)
                flow.payload_entropy_sample += pkt.payload[:remaining]

        # Check completion conditions
        if self._should_complete(flow, pkt):
            del self.flows[flow_key]
            return flow

        return None

    def flush_expired(self) -> List[FlowBuffer]:
        """
        Flush flows that have exceeded the idle timeout.

        Returns:
            List of completed FlowBuffers.
        """
        current_time = time.time()
        expired_keys: List[FlowKey] = []

        for key, flow in self.flows.items():
            if current_time - flow.last_seen > self.config.idle_timeout:
                expired_keys.append(key)

        expired_flows: List[FlowBuffer] = []
        for key in expired_keys:
            expired_flows.append(self.flows.pop(key))

        return expired_flows

    @property
    def active_flow_count(self) -> int:
        """Number of flows currently in the buffer."""
        return len(self.flows)

    # ── Private methods ──────────────────────────────────────────

    def _should_complete(self, flow: FlowBuffer, pkt: PacketRecord) -> bool:
        """Check if flow should be completed."""
        # TCP FIN or RST
        if pkt.protocol == 6:  # TCP
            # FIN flag = 0x01, RST flag = 0x04
            if pkt.flags & 0x01 or pkt.flags & 0x04:
                return True

        # Active timeout
        if flow.duration > self.config.active_timeout:
            return True

        return False

    def _count_tcp_flags(self, flow: FlowBuffer, flags: int) -> None:
        """Count TCP flags from bitmask."""
        if flags & 0x02:  # SYN
            flow.syn_count += 1
        if flags & 0x10:  # ACK
            flow.ack_count += 1
        if flags & 0x01:  # FIN
            flow.fin_count += 1
        if flags & 0x04:  # RST
            flow.rst_count += 1
        if flags & 0x08:  # PSH
            flow.psh_count += 1
        if flags & 0x20:  # URG
            flow.urg_count += 1

    def _evict_oldest(self) -> Optional[FlowBuffer]:
        """Evict the oldest flow when buffer is full."""
        if not self.flows:
            return None

        oldest_key = min(self.flows, key=lambda k: self.flows[k].start_time)
        return self.flows.pop(oldest_key)