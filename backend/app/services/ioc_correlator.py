"""
ThreatMatrix AI — IOC Correlation Engine

Per MASTER_DOC_PART4 §11.3:
  1. Check src_ip / dst_ip against threat_intel_iocs table
  2. Check dst_domain (from DNS) against threat_intel_iocs table
  3. Check file hashes (payload) against VirusTotal
  4. If match → auto-escalate alert severity to at least HIGH
  5. Return correlation results for downstream consumers

DB Table: threat_intel_iocs (MASTER_DOC_PART2 §4.2)
  Columns: ioc_type, ioc_value, threat_type, severity, source,
           confidence, tags, first_seen, last_seen, is_active

Integration: Called from AlertEngine._process_alert() after INSERT,
             before LLM narrative generation.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import text

from app.database import async_session

logger = logging.getLogger(__name__)


class IOCCorrelator:
    """
    Correlates live network flow IPs, domains, and file hashes
    against stored IOCs in the threat_intel_iocs table.

    Per §11.3:
      - IP match → escalate severity
      - Domain match → flag as C2/phishing
      - Hash match → flag as malware

    Gracefully degrades when the IOC table is empty (no API keys loaded).
    """

    async def check_ip(self, ip_address: str) -> Optional[Dict[str, Any]]:
        """
        Check if an IP exists in the threat_intel_iocs table.

        Args:
            ip_address: IPv4 or IPv6 address to look up.

        Returns:
            IOC data dict if found and active, None otherwise.
        """
        async with async_session() as session:
            result = await session.execute(
                text(
                    "SELECT ioc_value, threat_type, severity, source, "
                    "       confidence, tags, first_seen, last_seen "
                    "FROM threat_intel_iocs "
                    "WHERE ioc_type = 'ip' "
                    "  AND ioc_value = :ip "
                    "  AND is_active = true "
                    "ORDER BY confidence DESC "
                    "LIMIT 1"
                ),
                {"ip": ip_address},
            )
            row = result.fetchone()
            if row:
                return {
                    "ioc_value": row[0],
                    "threat_type": row[1],
                    "severity": row[2],
                    "source": row[3],
                    "confidence": row[4],
                    "tags": row[5],
                    "first_seen": str(row[6]) if row[6] else None,
                    "last_seen": str(row[7]) if row[7] else None,
                }
        return None

    async def check_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Check if a domain exists in the threat_intel_iocs table.
        Per PART4 §11.3 item 2: flag as C2/phishing if matched.

        Args:
            domain: Domain name to look up (e.g., 'evil-c2.com').

        Returns:
            IOC data dict if found and active, None otherwise.
        """
        if not domain:
            return None

        async with async_session() as session:
            result = await session.execute(
                text(
                    "SELECT ioc_value, threat_type, severity, source, "
                    "       confidence, tags, first_seen, last_seen "
                    "FROM threat_intel_iocs "
                    "WHERE ioc_type = 'domain' "
                    "  AND ioc_value = :domain "
                    "  AND is_active = true "
                    "ORDER BY confidence DESC "
                    "LIMIT 1"
                ),
                {"domain": domain},
            )
            row = result.fetchone()
            if row:
                return {
                    "ioc_value": row[0],
                    "threat_type": row[1],
                    "severity": row[2],
                    "source": row[3],
                    "confidence": row[4],
                    "tags": row[5],
                    "first_seen": str(row[6]) if row[6] else None,
                    "last_seen": str(row[7]) if row[7] else None,
                    "match_type": "c2_phishing",  # Per §11.3 item 2
                }
        return None

    async def check_hash(self, file_hash: str) -> Optional[Dict[str, Any]]:
        """
        Check if a file hash exists in threat_intel_iocs table OR query VirusTotal.
        Per PART4 §11.3 item 3: if detected → flag as malware.

        Args:
            file_hash: MD5, SHA1, or SHA256 hash to look up.

        Returns:
            IOC data dict if found, None otherwise.
        """
        if not file_hash:
            return None

        # First, check local IOC database
        async with async_session() as session:
            result = await session.execute(
                text(
                    "SELECT ioc_value, threat_type, severity, source, confidence "
                    "FROM threat_intel_iocs "
                    "WHERE ioc_type = 'hash' "
                    "  AND ioc_value = :hash "
                    "  AND is_active = true "
                    "LIMIT 1"
                ),
                {"hash": file_hash},
            )
            row = result.fetchone()
            if row:
                return {
                    "hash": row[0],
                    "threat_type": row[1],
                    "severity": row[2],
                    "source": row[3],
                    "confidence": row[4],
                    "match_type": "malware",
                }

        # If not in local DB, try VirusTotal (on-demand per §11.2)
        try:
            from app.services.threat_intel import VirusTotalClient

            vt = VirusTotalClient()
            if vt.enabled:
                result = await vt.check_hash(file_hash)
                if result.get("is_malware"):
                    return {
                        "hash": file_hash,
                        "threat_type": "malware",
                        "severity": "critical",
                        "source": "virustotal",
                        "confidence": 0.9,
                        "detection_ratio": result.get("detection_ratio", "0/0"),
                        "match_type": "malware",
                    }
                await vt.close()
        except Exception as e:
            logger.error("[IOC] VT hash check failed: %s", e)

        return None

    async def correlate_flow(
        self, flow_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Correlate a flow's IPs, domain, and file hash against IOC database.
        Per §11.3: IP match → escalate, domain match → flag C2/phishing,
        hash match → flag malware.

        Args:
            flow_data: Dict containing source_ip/src_ip, dest_ip/dst_ip,
                       dst_domain/domain, and file_hash/payload_hash.

        Returns:
            {
                "src_match": {...} or None,
                "dst_match": {...} or None,
                "domain_match": {...} or None,
                "hash_match": {...} or None,
                "has_ioc_match": bool,
                "escalation_severity": str or None,
                "flags": [...],
            }
        """
        src_ip = flow_data.get("source_ip") or flow_data.get("src_ip")
        dst_ip = flow_data.get("dest_ip") or flow_data.get("dst_ip")
        dst_domain = flow_data.get("dst_domain") or flow_data.get("domain")
        file_hash = flow_data.get("file_hash") or flow_data.get("payload_hash")

        src_match = await self.check_ip(src_ip) if src_ip else None
        dst_match = await self.check_ip(dst_ip) if dst_ip else None
        domain_match = await self.check_domain(dst_domain) if dst_domain else None
        hash_match = await self.check_hash(file_hash) if file_hash else None

        has_match = any([src_match, dst_match, domain_match, hash_match])

        # Determine escalation and flags per §11.3
        escalation: Optional[str] = None
        flags: List[str] = []

        if has_match:
            # IP match → escalate severity
            if src_match or dst_match:
                match_severity = (src_match or dst_match or {}).get(
                    "severity", "medium"
                )
                if match_severity == "critical":
                    escalation = "critical"
                elif match_severity == "high":
                    escalation = "high"
                else:
                    escalation = "high"  # Any IOC match → at least HIGH

            # Domain match → flag as C2/phishing (§11.3 item 2)
            if domain_match:
                flags.append("c2_phishing")
                if not escalation:
                    escalation = "high"

            # Hash match → flag as malware (§11.3 item 3)
            if hash_match:
                flags.append("malware")
                escalation = "critical"  # Malware → always CRITICAL

        return {
            "src_match": src_match,
            "dst_match": dst_match,
            "domain_match": domain_match,
            "hash_match": hash_match,
            "has_ioc_match": has_match,
            "escalation_severity": escalation,
            "flags": flags,
        }

    async def bulk_check(
        self, ip_list: List[str]
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Check multiple IPs against the IOC database.

        Args:
            ip_list: List of IP addresses to check.

        Returns:
            Dict mapping each IP to its IOC data (or None if not found).
        """
        results: Dict[str, Optional[Dict[str, Any]]] = {}
        for ip in ip_list:
            results[ip] = await self.check_ip(ip)
        return results
