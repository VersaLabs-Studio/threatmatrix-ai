"""
ThreatMatrix AI — Threat Intelligence Service

Per MASTER_DOC_PART4 §11:
  - AlienVault OTX: Pull pulses, IOCs (free, unlimited)
  - AbuseIPDB: On-demand IP reputation lookup (free, 1K/day)
  - VirusTotal: File hash / IP / domain analysis (free, 500/day)
  - Normalizer: Deduplicate, score merge, tag enrich
  - Correlator: Match IOCs against live network flows
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class OTXClient:
    """AlienVault OTX threat intelligence client."""

    BASE_URL = "https://otx.alienvault.com/api/v1"

    def __init__(self) -> None:
        self.api_key = os.environ.get("OTX_API_KEY", "")
        self.enabled = bool(self.api_key)
        self._client: Optional[httpx.AsyncClient] = None
        if self.enabled:
            logger.info("[ThreatIntel] OTX client initialized")
        else:
            logger.warning("[ThreatIntel] OTX_API_KEY not set")

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers={"X-OTX-API-KEY": self.api_key},
                timeout=30.0,
            )
        return self._client

    async def get_subscribed_pulses(self, limit: int = 20) -> List[Dict]:
        """Get latest subscribed pulses."""
        if not self.enabled:
            return []
        client = await self._get_client()
        try:
            resp = await client.get(f"/pulses/subscribed?limit={limit}")
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [])
        except Exception as e:
            logger.error("[OTX] Failed to get pulses: %s", e)
            return []

    async def lookup_ip(self, ip: str) -> Dict[str, Any]:
        """Lookup IP reputation and associated IOCs."""
        if not self.enabled:
            return {"error": "OTX not configured"}
        client = await self._get_client()
        try:
            resp = await client.get(f"/indicators/IPv4/{ip}/general")
            resp.raise_for_status()
            data = resp.json()
            return {
                "ip": ip,
                "pulse_count": data.get("pulse_info", {}).get("count", 0),
                "reputation": data.get("reputation", 0),
                "country": data.get("country_name", "Unknown"),
                "asn": data.get("asn", ""),
                "pulses": [
                    {"name": p.get("name"), "created": p.get("created")}
                    for p in data.get("pulse_info", {}).get("pulses", [])[:5]
                ],
            }
        except Exception as e:
            logger.error("[OTX] IP lookup failed for %s: %s", ip, e)
            return {"ip": ip, "error": str(e)}

    async def lookup_domain(self, domain: str) -> Dict[str, Any]:
        """Lookup domain reputation."""
        if not self.enabled:
            return {"error": "OTX not configured"}
        client = await self._get_client()
        try:
            resp = await client.get(f"/indicators/domain/{domain}/general")
            resp.raise_for_status()
            data = resp.json()
            return {
                "domain": domain,
                "pulse_count": data.get("pulse_info", {}).get("count", 0),
                "alexa_rank": data.get("alexa", ""),
                "whois": data.get("whois", ""),
            }
        except Exception as e:
            logger.error("[OTX] Domain lookup failed: %s", e)
            return {"domain": domain, "error": str(e)}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


class AbuseIPDBClient:
    """AbuseIPDB IP reputation client."""

    BASE_URL = "https://api.abuseipdb.com/api/v2"

    def __init__(self) -> None:
        self.api_key = os.environ.get("ABUSEIPDB_API_KEY", "")
        self.enabled = bool(self.api_key)
        self._client: Optional[httpx.AsyncClient] = None
        if self.enabled:
            logger.info("[ThreatIntel] AbuseIPDB client initialized")
        else:
            logger.warning("[ThreatIntel] ABUSEIPDB_API_KEY not set")

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers={
                    "Key": self.api_key,
                    "Accept": "application/json",
                },
                timeout=15.0,
            )
        return self._client

    async def check_ip(self, ip: str, max_age_days: int = 90) -> Dict[str, Any]:
        """Check IP reputation."""
        if not self.enabled:
            return {"error": "AbuseIPDB not configured"}
        client = await self._get_client()
        try:
            resp = await client.get(
                "/check",
                params={"ipAddress": ip, "maxAgeInDays": max_age_days, "verbose": True},
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})
            return {
                "ip": ip,
                "abuse_confidence": data.get("abuseConfidenceScore", 0),
                "total_reports": data.get("totalReports", 0),
                "country": data.get("countryCode", ""),
                "isp": data.get("isp", ""),
                "domain": data.get("domain", ""),
                "is_tor": data.get("isTor", False),
                "is_public": data.get("isPublic", True),
                "last_reported": data.get("lastReportedAt"),
                "categories": data.get("reports", [])[:5],
            }
        except Exception as e:
            logger.error("[AbuseIPDB] Check failed for %s: %s", ip, e)
            return {"ip": ip, "error": str(e)}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


class VirusTotalClient:
    """VirusTotal file/IP/domain analysis client."""

    BASE_URL = "https://www.virustotal.com/api/v3"

    def __init__(self) -> None:
        self.api_key = os.environ.get("VIRUSTOTAL_API_KEY", "")
        self.enabled = bool(self.api_key)
        self._client: Optional[httpx.AsyncClient] = None
        if self.enabled:
            logger.info("[ThreatIntel] VirusTotal client initialized")
        else:
            logger.warning("[ThreatIntel] VIRUSTOTAL_API_KEY not set")

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers={"x-apikey": self.api_key},
                timeout=30.0,
            )
        return self._client

    async def check_hash(self, file_hash: str) -> Dict[str, Any]:
        """
        Check a file hash against VirusTotal.
        Per §11.3 item 3: if detected → flag as malware.

        Args:
            file_hash: MD5, SHA1, or SHA256 hash.

        Returns:
            Dict with detection results.
        """
        if not self.enabled:
            return {"error": "VirusTotal not configured"}
        client = await self._get_client()
        try:
            resp = await client.get(f"/files/{file_hash}")
            resp.raise_for_status()
            data = resp.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {})
            return {
                "hash": file_hash,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "undetected": stats.get("undetected", 0),
                "total_engines": sum(stats.values()) if stats else 0,
                "detection_ratio": f"{stats.get('malicious', 0)}/{sum(stats.values()) if stats else 0}",
                "is_malware": stats.get("malicious", 0) > 3,  # >3 engines flagged
                "file_type": data.get("type_description", "unknown"),
                "names": data.get("names", [])[:5],
            }
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"hash": file_hash, "is_malware": False, "message": "Not found in VT"}
            logger.error("[VT] Hash check failed: %s", e)
            return {"hash": file_hash, "error": str(e)}
        except Exception as e:
            logger.error("[VT] Hash check failed: %s", e)
            return {"hash": file_hash, "error": str(e)}

    async def check_ip(self, ip: str) -> Dict[str, Any]:
        """Check IP reputation on VirusTotal."""
        if not self.enabled:
            return {"error": "VirusTotal not configured"}
        client = await self._get_client()
        try:
            resp = await client.get(f"/ip_addresses/{ip}")
            resp.raise_for_status()
            data = resp.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {})
            return {
                "ip": ip,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "country": data.get("country", ""),
                "as_owner": data.get("as_owner", ""),
                "reputation": data.get("reputation", 0),
            }
        except Exception as e:
            logger.error("[VT] IP check failed: %s", e)
            return {"ip": ip, "error": str(e)}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


class ThreatIntelService:
    """
    Unified threat intelligence service.
    Aggregates OTX + AbuseIPDB + VirusTotal results.
    """

    def __init__(self) -> None:
        self.otx = OTXClient()
        self.abuseipdb = AbuseIPDBClient()
        self.virustotal = VirusTotalClient()
        self.stats = {"lookups": 0, "iocs_found": 0}

    async def lookup_ip(self, ip: str) -> Dict[str, Any]:
        """Combined IP lookup from all sources."""
        self.stats["lookups"] += 1

        otx_result = await self.otx.lookup_ip(ip)
        abuse_result = await self.abuseipdb.check_ip(ip)

        # Compute combined threat score
        otx_score = min(otx_result.get("pulse_count", 0) / 10, 1.0)
        abuse_score = abuse_result.get("abuse_confidence", 0) / 100

        combined_score = max(otx_score, abuse_score)

        if combined_score > 0:
            self.stats["iocs_found"] += 1

        return {
            "ip": ip,
            "combined_threat_score": combined_score,
            "risk_level": (
                "critical" if combined_score >= 0.8 else
                "high" if combined_score >= 0.6 else
                "medium" if combined_score >= 0.3 else
                "low" if combined_score > 0 else "clean"
            ),
            "otx": otx_result,
            "abuseipdb": abuse_result,
            "lookup_time": datetime.now(timezone.utc).isoformat(),
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "otx_enabled": self.otx.enabled,
            "abuseipdb_enabled": self.abuseipdb.enabled,
            "virustotal_enabled": self.virustotal.enabled,
            "stats": self.stats,
        }

    async def close(self) -> None:
        await self.otx.close()
        await self.abuseipdb.close()
        await self.virustotal.close()
