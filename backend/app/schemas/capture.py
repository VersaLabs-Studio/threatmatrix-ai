"""
ThreatMatrix AI — Capture Schemas

Pydantic request/response models for capture engine API endpoints.
Per MASTER_DOC_PART2 §5.1
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class CaptureStatus(BaseModel):
    """Capture engine status response."""

    status: str = Field(..., description="Engine status: running | stopped")
    interface: Optional[str] = Field(None, description="Network interface")
    packets_captured: int = Field(0, description="Total packets captured")
    flows_completed: int = Field(0, description="Total flows completed")
    flows_published: int = Field(0, description="Total flows published to Redis")
    publish_errors: int = Field(0, description="Publish error count")
    active_flows: int = Field(0, description="Flows currently in buffer")
    uptime_seconds: float = Field(0.0, description="Seconds since engine start")


class CaptureStartRequest(BaseModel):
    """Request body for starting capture."""

    interface: Optional[str] = Field(
        default="eth0",
        description="Network interface to capture on"
    )
    bpf_filter: Optional[str] = Field(
        default="",
        description="Berkeley Packet Filter expression"
    )


class CaptureStartResponse(BaseModel):
    """Response for capture start."""

    status: str = Field(..., description="Started status")
    interface: str = Field(..., description="Interface capturing on")
    message: str = Field(..., description="Human-readable message")


class CaptureStopResponse(BaseModel):
    """Response for capture stop."""

    status: str = Field(..., description="Stopped status")
    message: str = Field(..., description="Human-readable message")


class NetworkInterface(BaseModel):
    """Available network interface."""

    name: str = Field(..., description="Interface name")
    description: str = Field(..., description="Interface description")


class InterfaceList(BaseModel):
    """List of available network interfaces."""

    interfaces: List[NetworkInterface] = Field(
        default_factory=list,
        description="Available network interfaces"
    )