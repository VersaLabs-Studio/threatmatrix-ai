"""
ThreatMatrix AI — Capture Engine Configuration

Pydantic-based configuration for the capture engine.
Reads from environment variables with CAPTURE_ prefix.
"""

from pydantic import Field
from pydantic_settings import BaseSettings


class CaptureConfig(BaseSettings):
    """Capture engine configuration."""

    # Network interface to capture on
    interface: str = Field(
        default="eth0",
        description="Network interface for packet capture"
    )

    # Flow timeouts (seconds)
    active_timeout: float = Field(
        default=10.0,
        description="Flow active timeout — force completion after this duration"
    )
    idle_timeout: float = Field(
        default=15.0,
        description="Flow idle timeout — flush if no packets for this duration"
    )

    # BPF filter
    bpf_filter: str = Field(
        default="",
        description="Berkeley Packet Filter expression"
    )

    # Buffer settings
    max_flows_buffer: int = Field(
        default=10000,
        description="Maximum flows held in memory simultaneously"
    )

    # Redis pub/sub
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    redis_channel: str = Field(
        default="flows:live",
        description="Redis pub/sub channel for flow events"
    )

    # Batch publishing
    batch_size: int = Field(
        default=50,
        description="Number of flows per batch publish"
    )

    # Stats reporting
    stats_interval: float = Field(
        default=30.0,
        description="Seconds between capture statistics reports"
    )

    # Flush interval
    flush_interval: float = Field(
        default=5.0,
        description="Seconds between expired flow flush checks"
    )

    class Config:
        env_prefix = "CAPTURE_"
        case_sensitive = False


# Module-level config instance
capture_config = CaptureConfig()