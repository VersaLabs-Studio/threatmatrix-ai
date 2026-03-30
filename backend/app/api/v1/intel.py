"""
ThreatMatrix AI — Threat Intelligence API

Per MASTER_DOC_PART2 §5.1:
  GET  /intel/iocs              → List IOCs (paginated)
  GET  /intel/lookup/{ip_or_domain} → IP/domain reputation lookup
  POST /intel/sync              → Trigger feed synchronization
  GET  /intel/feeds/status      → Feed health status
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text

from app.database import async_session
from app.dependencies import require_role
from app.models.user import User
from app.services.audit_service import log_audit_event_sync

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/intel", tags=["Threat Intelligence"])

_service = None


def set_service(service):
    global _service
    _service = service


def get_service():
    if _service is None:
        raise HTTPException(status_code=503, detail="Threat Intel service not initialized")
    return _service


@router.get("/lookup/{ip_or_domain}")
async def lookup(ip_or_domain: str):
    """IP/domain reputation lookup."""
    service = get_service()
    # Simple heuristic: if contains dots and all parts numeric → IP
    parts = ip_or_domain.split(".")
    if all(p.isdigit() for p in parts) and len(parts) == 4:
        return await service.lookup_ip(ip_or_domain)
    else:
        return await service.otx.lookup_domain(ip_or_domain)


@router.get("/feeds/status")
async def feeds_status():
    """Feed health status."""
    service = get_service()
    return service.get_status()


@router.post("/sync")
async def sync_feeds(
    current_user: User = Depends(require_role(["admin"])),
):
    """
    Trigger OTX feed sync and populate threat_intel_iocs table.
    Per MASTER_DOC_PART4 §11.1-11.2: Pull latest pulses, extract IOCs,
    and persist to database with upsert logic.
    """
    service = get_service()
    pulses = await service.otx.get_subscribed_pulses(limit=50)

    iocs_inserted = 0
    async with async_session() as session:
        for pulse in pulses:
            for indicator in pulse.get("indicators", []):
                ioc_type = indicator.get("type", "").lower()
                ioc_value = indicator.get("indicator", "")

                # Map OTX indicator types to our schema
                type_map = {
                    "ipv4": "ip",
                    "ipv6": "ip",
                    "domain": "domain",
                    "hostname": "domain",
                    "filehash-md5": "hash",
                    "filehash-sha1": "hash",
                    "filehash-sha256": "hash",
                    "url": "url",
                    "email": "email",
                }
                mapped_type = type_map.get(ioc_type)
                if not mapped_type or not ioc_value:
                    continue

                # Upsert IOC — ON CONFLICT updates last_seen
                await session.execute(
                    text("""
                        INSERT INTO threat_intel_iocs
                            (ioc_type, ioc_value, threat_type, severity, source,
                             confidence, tags, is_active, first_seen, last_seen)
                        VALUES
                            (:ioc_type, :ioc_value, :threat_type, :severity, 'otx',
                             :confidence, :tags, true, NOW(), NOW())
                        ON CONFLICT (ioc_type, ioc_value, source)
                        DO UPDATE SET last_seen = NOW(), is_active = true
                    """),
                    {
                        "ioc_type": mapped_type,
                        "ioc_value": ioc_value,
                        "threat_type": pulse.get("adversary", "unknown"),
                        "severity": "high" if "malware" in str(pulse.get("tags", [])).lower() else "medium",
                        "confidence": 0.8,
                        "tags": pulse.get("tags", [])[:5],
                    },
                )
                iocs_inserted += 1

        await session.commit()

    # Audit log (fire-and-forget)
    log_audit_event_sync(
        action="ioc_sync",
        entity_type="threat_intel",
        user_id=str(current_user.id),
        details={"synced_pulses": len(pulses), "iocs_inserted": iocs_inserted},
    )

    logger.info(
        "[Intel API] OTX sync complete: %d pulses, %d IOCs inserted",
        len(pulses),
        iocs_inserted,
    )

    return {
        "synced_pulses": len(pulses),
        "iocs_inserted": iocs_inserted,
        "status": "complete",
    }


@router.get("/iocs")
async def list_iocs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    ioc_type: Optional[str] = Query(None, description="Filter by IOC type: ip, domain, hash, url, email"),
):
    """
    List IOCs from threat_intel_iocs table.
    Per MASTER_DOC_PART2 §5.1: Paginated IOC listing with optional type filter.
    """
    async with async_session() as session:
        where_clause = "WHERE is_active = true"
        params: dict = {"limit": limit, "offset": offset}

        if ioc_type:
            where_clause += " AND ioc_type = :ioc_type"
            params["ioc_type"] = ioc_type

        count_result = await session.execute(
            text(f"SELECT COUNT(*) FROM threat_intel_iocs {where_clause}"),
            params,
        )
        total = count_result.scalar()

        result = await session.execute(
            text(f"""
                SELECT ioc_type, ioc_value, threat_type, severity, source,
                       confidence, tags, first_seen, last_seen
                FROM threat_intel_iocs
                {where_clause}
                ORDER BY last_seen DESC
                LIMIT :limit OFFSET :offset
            """),
            params,
        )
        rows = result.fetchall()

    return {
        "iocs": [
            {
                "ioc_type": r[0],
                "ioc_value": r[1],
                "threat_type": r[2],
                "severity": r[3],
                "source": r[4],
                "confidence": r[5],
                "tags": r[6],
                "first_seen": str(r[7]) if r[7] else None,
                "last_seen": str(r[8]) if r[8] else None,
            }
            for r in rows
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
