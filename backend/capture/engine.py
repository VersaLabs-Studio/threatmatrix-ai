"""
ThreatMatrix AI — Capture Engine

Main orchestrator for packet capture, flow aggregation, feature extraction,
and real-time publishing via Redis pub/sub.

Per MASTER_DOC_PART2 §2.1 and MASTER_DOC_PART4 §8.1
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, Optional

from scapy.all import IP, TCP, UDP, ICMP, Packet, sniff

from capture.config import CaptureConfig
from capture.flow_aggregator import FlowAggregator, FlowBuffer, PacketRecord
from capture.feature_extractor import FeatureExtractor
from capture.publisher import FlowPublisher

logger = logging.getLogger(__name__)


class CaptureEngine:
    """
    Main capture engine orchestrating the full pipeline:

    1. Sniff packets via Scapy (blocking — runs in executor)
    2. Extract packet data into PacketRecord
    3. Aggregate into FlowBuffer via FlowAggregator
    4. On flow completion → extract features → publish to Redis
    5. Periodically flush expired flows
    6. Report statistics
    """

    def __init__(self, config: CaptureConfig) -> None:
        self.config = config
        self.aggregator = FlowAggregator(config)
        self.extractor = FeatureExtractor()
        self.publisher = FlowPublisher(
            redis_url=config.redis_url,
            flow_channel=config.redis_channel,
        )

        self.running = False
        self.stats: Dict[str, Any] = {
            "packets_captured": 0,
            "flows_completed": 0,
            "flows_published": 0,
            "publish_errors": 0,
            "start_time": None,
            "interface": config.interface,
        }

        self._loop: Optional[asyncio.AbstractEventLoop] = None

    async def start(self) -> None:
        """Start the capture engine (async entry point)."""
        if self.running:
            logger.warning("[Engine] Already running")
            return

        self.running = True
        self.stats["start_time"] = time.time()
        self._loop = asyncio.get_event_loop()

        logger.info(
            "[Engine] Starting capture on interface=%s filter=%s",
            self.config.interface,
            self.config.bpf_filter or "(none)",
        )

        # Connect to Redis
        await self.publisher.connect()

        # Start background tasks
        flush_task = asyncio.create_task(self._flush_loop())
        stats_task = asyncio.create_task(self._stats_loop())

        # Run blocking capture in executor
        try:
            await self._loop.run_in_executor(None, self._capture_loop)
        finally:
            self.running = False
            flush_task.cancel()
            stats_task.cancel()
            await self.publisher.close()
            logger.info("[Engine] Capture engine stopped")

    def stop(self) -> None:
        """Stop the capture engine."""
        self.running = False
        logger.info("[Engine] Stop requested")

    def get_status(self) -> Dict[str, Any]:
        """Get current engine status."""
        elapsed = 0.0
        if self.stats["start_time"]:
            elapsed = time.time() - self.stats["start_time"]

        return {
            "status": "running" if self.running else "stopped",
            "interface": self.config.interface,
            "packets_captured": self.stats["packets_captured"],
            "flows_completed": self.stats["flows_completed"],
            "flows_published": self.stats["flows_published"],
            "publish_errors": self.stats["publish_errors"],
            "active_flows": self.aggregator.active_flow_count,
            "uptime_seconds": round(elapsed, 1),
        }

    # ── Capture Loop (blocking — runs in executor) ─────────────────

    def _capture_loop(self) -> None:
        """Blocking packet capture loop using Scapy."""
        logger.info("[Engine] Capture loop started on %s", self.config.interface)

        try:
            sniff(
                iface=self.config.interface,
                prn=self._process_packet,
                filter=self.config.bpf_filter or None,
                store=False,
                stop_filter=lambda _: not self.running,
            )
        except PermissionError:
            logger.error(
                "[Engine] Permission denied — capture requires root/privileged mode"
            )
        except Exception as exc:
            logger.error("[Engine] Capture error: %s", exc)

    def _process_packet(self, packet: Packet) -> None:
        """Process a single captured packet."""
        self.stats["packets_captured"] += 1

        pkt_record = self._extract_packet(packet)
        if pkt_record is None:
            return

        completed_flow = self.aggregator.add_packet(pkt_record)
        if completed_flow is not None:
            self._handle_completed_flow(completed_flow)

    def _extract_packet(self, packet: Packet) -> Optional[PacketRecord]:
        """Extract relevant data from Scapy packet into PacketRecord."""
        try:
            if not packet.haslayer(IP):
                return None

            ip_layer = packet[IP]

            # Guard: skip malformed IP
            if not hasattr(ip_layer, 'src') or not hasattr(ip_layer, 'dst'):
                return None

            # Guard: skip multicast/broadcast
            if ip_layer.dst.startswith('224.') or ip_layer.dst == '255.255.255.255':
                return None

            timestamp = time.time()
            length = len(packet)

            # Default values
            src_port = 0
            dst_port = 0
            flags = 0
            payload = b""

            if packet.haslayer(TCP):
                tcp = packet[TCP]
                src_port = tcp.sport
                dst_port = tcp.dport
                flags = int(tcp.flags)
                payload = bytes(tcp.payload) if tcp.payload else b""
            elif packet.haslayer(UDP):
                udp = packet[UDP]
                src_port = udp.sport
                dst_port = udp.dport
                payload = bytes(udp.payload) if udp.payload else b""
            elif packet.haslayer(ICMP):
                # ICMP has no ports
                pass

            return PacketRecord(
                src_ip=ip_layer.src,
                dst_ip=ip_layer.dst,
                src_port=src_port,
                dst_port=dst_port,
                protocol=ip_layer.proto,
                length=length,
                payload=payload,
                timestamp=timestamp,
                flags=flags,
            )
        except Exception as exc:
            logger.debug("[Engine] Packet parse error: %s", exc)
            return None

    # ── Flow Completion Handler ────────────────────────────────────

    def _handle_completed_flow(self, flow: FlowBuffer) -> None:
        """Process a completed flow: extract features, publish, persist."""
        self.stats["flows_completed"] += 1

        # Extract features
        features = self.extractor.extract(flow)

        # Build flow record
        flow_record: Dict[str, Any] = {
            "timestamp": time.time(),
            "src_ip": flow.key.src_ip,
            "dst_ip": flow.key.dst_ip,
            "src_port": flow.key.src_port,
            "dst_port": flow.key.dst_port,
            "protocol": flow.key.protocol,
            "duration": features["duration"],
            "total_bytes": features["total_bytes"],
            "total_packets": features["total_packets"],
            "src_bytes": features["src_bytes"],
            "dst_bytes": features["dst_bytes"],
            "features": features,
            "source": "live",
        }

        # Schedule async publish
        if self._loop is not None and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self._publish_flow(flow_record), self._loop
            )

    async def _publish_flow(self, flow_record: Dict[str, Any]) -> None:
        """Publish flow to Redis (async)."""
        try:
            await self.publisher.publish_flow(flow_record)
            self.stats["flows_published"] += 1
        except Exception as exc:
            self.stats["publish_errors"] += 1
            logger.error("[Engine] Publish error: %s", exc)

    # ── Background Loops ───────────────────────────────────────────

    async def _flush_loop(self) -> None:
        """Periodically flush expired flows."""
        while self.running:
            try:
                await asyncio.sleep(self.config.flush_interval)
                expired = self.aggregator.flush_expired()
                for flow in expired:
                    self._handle_completed_flow(flow)

                if expired:
                    logger.debug("[Engine] Flushed %d expired flows", len(expired))
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("[Engine] Flush error: %s", exc)

    async def _stats_loop(self) -> None:
        """Periodically report capture statistics."""
        while self.running:
            try:
                await asyncio.sleep(self.config.stats_interval)
                status = self.get_status()
                pps = status["packets_captured"] / max(status["uptime_seconds"], 1)

                # Memory check: warn if flow buffer is > 80% full
                buffer_usage = status["active_flows"] / self.config.max_flows_buffer
                if buffer_usage > 0.8:
                    logger.warning(
                        "[Engine] Flow buffer at %.0f%% capacity (%d/%d)",
                        buffer_usage * 100,
                        status["active_flows"],
                        self.config.max_flows_buffer,
                    )

                logger.info(
                    "[Engine] Stats: %d pkts | %d flows | %d published | %.1f pps | %d active (%.0f%%)",
                    status["packets_captured"],
                    status["flows_completed"],
                    status["flows_published"],
                    pps,
                    status["active_flows"],
                    buffer_usage * 100,
                )

                # Publish status to Redis
                await self.publisher.publish_system_status(status)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("[Engine] Stats error: %s", exc)


# ── CLI Entry Point ──────────────────────────────────────────────

def main() -> None:
    """Run capture engine as standalone process."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    config = CaptureConfig()
    engine = CaptureEngine(config)

    # Graceful shutdown on signal
    import signal

    def shutdown_handler(signum: int, frame: Any) -> None:
        logger.info("Received signal %d, shutting down...", signum)
        engine.stop()

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    logger.info("ThreatMatrix AI Capture Engine v0.1.0")
    logger.info("Interface: %s", config.interface)
    logger.info("Redis: %s", config.redis_url)
    logger.info("Press Ctrl+C to stop")

    asyncio.run(engine.start())


if __name__ == "__main__":
    main()