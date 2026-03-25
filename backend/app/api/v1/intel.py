"""
ThreatMatrix AI — Threat Intelligence API

Per MASTER_DOC_PART2 §5.1:
  GET  /intel/iocs              → List IOCs (paginated)
  GET  /intel/lookup/{ip_or_domain} → IP/domain reputation lookup
  POST /intel/sync              → Trigger feed synchronization
  GET  /intel/feeds/status      → Feed health status
"""

from fastapi import APIRouter, HTTPException

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
async def sync_feeds():
    """Trigger OTX feed sync."""
    service = get_service()
    pulses = await service.otx.get_subscribed_pulses(limit=10)
    return {"synced_pulses": len(pulses), "status": "complete"}


@router.get("/iocs")
async def list_iocs(limit: int = 50, offset: int = 0):
    """List IOCs from database (placeholder — will query threat_intel_iocs table)."""
    return {"iocs": [], "total": 0, "limit": limit, "offset": offset,
            "message": "IOC database population in progress"}
