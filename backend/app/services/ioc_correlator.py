"""
ThreatMatrix AI — IOC Correlation Engine

Per MASTER_DOC_PART4 §11.3:
  1. Check src_ip / dst_ip against threat_intel_iocs table
  2. If match → auto-escalate alert severity to at least HIGH
  3. Return correlation results for downstream consumers

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
    Correlates live network flow IPs against stored IOCs
    in the threat_intel_iocs table.

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

    async def correlate_flow(
        self, flow_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Correlate a flow's source and destination IPs against IOC database.

        Args:
            flow_data: Dict containing source_ip/src_ip and dest_ip/dst_ip.

        Returns:
            {
                "src_match": {...} or None,
                "dst_match": {...} or None,
                "has_ioc_match": bool,
                "escalation_severity": str or None,
            }
        """
        src_ip = flow_data.get("source_ip") or flow_data.get("src_ip")
        dst_ip = flow_data.get("dest_ip") or flow_data.get("dst_ip")

        src_match = await self.check_ip(src_ip) if src_ip else None
        dst_match = await self.check_ip(dst_ip) if dst_ip else None

        has_match = src_match is not None or dst_match is not None

        # Determine escalation per PART4 §11.3:
        # Any IOC match → at least HIGH severity
        escalation: Optional[str] = None
        if has_match:
            match_severity = (src_match or dst_match or {}).get(
                "severity", "medium"
            )
            if match_severity == "critical":
                escalation = "critical"
            elif match_severity == "high":
                escalation = "high"
            else:
                escalation = "high"  # Any IOC match → at least HIGH

        return {
            "src_match": src_match,
            "dst_match": dst_match,
            "has_ioc_match": has_match,
            "escalation_severity": escalation,
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
