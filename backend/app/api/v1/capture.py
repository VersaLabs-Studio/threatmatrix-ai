"""
ThreatMatrix AI — Capture API Routes

Control endpoints for the capture engine: start, stop, status, interfaces, upload-pcap.
Per MASTER_DOC_PART2 §5.1
"""

from __future__ import annotations

import asyncio
import logging
import tempfile
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.capture import (
    CaptureStartRequest,
    CaptureStartResponse,
    CaptureStatus,
    CaptureStopResponse,
    InterfaceList,
    NetworkInterface,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Capture"])

# ── Global capture engine instance ───────────────────────────────

_capture_engine: Optional["CaptureEngine"] = None


def _get_engine():
    """Lazily import and return the capture engine module."""
    from capture.engine import CaptureEngine
    from capture.config import CaptureConfig
    return CaptureEngine, CaptureConfig


# ── Endpoints ─────────────────────────────────────────────────────


@router.get("/status", response_model=CaptureStatus)
async def get_capture_status(
    user: User = Depends(get_current_user),
) -> CaptureStatus:
    """
    Get current capture engine status.
    All authenticated users can view status.
    """
    global _capture_engine

    if _capture_engine is None or not _capture_engine.running:
        return CaptureStatus(status="stopped")

    return CaptureStatus(**_capture_engine.get_status())


@router.post("/start", response_model=CaptureStartResponse)
async def start_capture(
    request: CaptureStartRequest,
    user: User = Depends(get_current_user),
) -> CaptureStartResponse:
    """
    Start packet capture on specified interface.
    RBAC: admin, soc_manager only.
    """
    global _capture_engine

    if user.role not in ("admin", "soc_manager"):
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions — requires admin or soc_manager role",
        )

    if _capture_engine is not None and _capture_engine.running:
        raise HTTPException(
            status_code=400,
            detail="Capture engine is already running",
        )

    CaptureEngine, CaptureConfig = _get_engine()

    config = CaptureConfig(
        interface=request.interface or "eth0",
        bpf_filter=request.bpf_filter or "",
    )

    _capture_engine = CaptureEngine(config)

    # Start capture in background
    asyncio.create_task(_capture_engine.start())

    logger.info(
        "[Capture API] Started by user=%s on interface=%s",
        user.email,
        config.interface,
    )

    return CaptureStartResponse(
        status="started",
        interface=config.interface,
        message=f"Capture engine started on {config.interface}",
    )


@router.post("/stop", response_model=CaptureStopResponse)
async def stop_capture(
    user: User = Depends(get_current_user),
) -> CaptureStopResponse:
    """
    Stop packet capture.
    RBAC: admin, soc_manager only.
    """
    global _capture_engine

    if user.role not in ("admin", "soc_manager"):
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions — requires admin or soc_manager role",
        )

    if _capture_engine is None or not _capture_engine.running:
        raise HTTPException(
            status_code=400,
            detail="Capture engine is not running",
        )

    _capture_engine.stop()
    logger.info("[Capture API] Stopped by user=%s", user.email)

    return CaptureStopResponse(
        status="stopped",
        message="Capture engine stopped",
    )


@router.get("/interfaces", response_model=InterfaceList)
async def list_interfaces(
    user: User = Depends(get_current_user),
) -> InterfaceList:
    """
    List available network interfaces.
    All authenticated users can view interfaces.
    """
    try:
        from scapy.all import get_if_list

        interfaces = [
            NetworkInterface(name=iface, description=f"Network interface: {iface}")
            for iface in get_if_list()
        ]
    except Exception as exc:
        logger.warning("[Capture API] Failed to list interfaces: %s", exc)
        interfaces = []

    return InterfaceList(interfaces=interfaces)


@router.post("/upload-pcap")
async def upload_pcap(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """
    Upload a PCAP file for historical analysis.
    Per MASTER_DOC_PART2 §5.1.

    The capture engine's pcap_processor.py handles parsing.
    Flows extracted from PCAP are scored by the ML ensemble.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not file.filename.endswith((".pcap", ".pcapng", ".cap")):
        raise HTTPException(
            status_code=400,
            detail="Only .pcap/.pcapng/.cap files accepted",
        )

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pcap") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    # Process PCAP in background
    task_id = str(uuid.uuid4())[:8]
    asyncio.create_task(
        _process_pcap(task_id, tmp_path, file.filename, len(content), str(user.id))
    )

    logger.info(
        "[Capture API] PCAP uploaded by user=%s: %s (%d bytes), task_id=%s",
        user.email,
        file.filename,
        len(content),
        task_id,
    )

    return {
        "status": "processing",
        "task_id": task_id,
        "filename": file.filename,
        "size_bytes": len(content),
    }


async def _process_pcap(task_id: str, tmp_path: str, filename: str, file_size: int = 0, user_id: str | None = None) -> None:
    """
    Background task to process uploaded PCAP file.
    Creates a pcap_uploads record, extracts flows, scores with ML ensemble.
    """
    try:
        logger.info("[PCAP] Processing task_id=%s, file=%s", task_id, filename)

        from app.services.pcap_processor import PcapProcessor

        processor = PcapProcessor()

        # Create upload record in database
        upload_id = await processor.create_upload_record(
            filename=filename,
            file_size=file_size,
            file_path=tmp_path,
            user_id=user_id,
        )

        # Process PCAP end-to-end
        result = await processor.process(tmp_path, upload_id)

        logger.info(
            "[PCAP] Task %s complete: %d packets, %d flows, %d anomalies",
            task_id,
            result.get("packets_read", 0),
            result.get("flows_extracted", 0),
            result.get("anomalies_found", 0),
        )
    except ImportError:
        logger.warning(
            "[PCAP] PcapProcessor not available — task %s dropped", task_id
        )
    except Exception as e:
        logger.error("[PCAP] Task %s failed: %s", task_id, e)
    finally:
        # Cleanup temp file
        import os
        try:
            os.unlink(tmp_path)
        except OSError:
            pass