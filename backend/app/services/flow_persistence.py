"""
ThreatMatrix AI — Flow Persistence Service

Persists captured network flows to PostgreSQL.
Handles batch inserts for high-throughput capture scenarios.

Per MASTER_DOC_PART2 §4.2 (network_flows table)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class FlowPersistence:
    """Persist captured flows to PostgreSQL network_flows table."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_flow(self, flow_data: Dict[str, Any]) -> str:
        """
        Save a single flow record to the database.

        Args:
            flow_data: Flow record dict with features, metadata, etc.

        Returns:
            UUID string of the created flow record.
        """
        query = text("""
            INSERT INTO network_flows (
                timestamp, src_ip, dst_ip, src_port, dst_port, protocol,
                duration, total_bytes, total_packets, src_bytes, dst_bytes,
                features, source, created_at
            ) VALUES (
                :timestamp, :src_ip, :dst_ip, :src_port, :dst_port, :protocol,
                :duration, :total_bytes, :total_packets, :src_bytes, :dst_bytes,
                :features, :source, NOW()
            )
            RETURNING id::text
        """)

        import json

        timestamp = flow_data.get("timestamp")
        if isinstance(timestamp, (int, float)):
            ts = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        else:
            ts = datetime.now(tz=timezone.utc)

        params = {
            "timestamp": ts,
            "src_ip": flow_data["src_ip"],
            "dst_ip": flow_data["dst_ip"],
            "src_port": flow_data.get("src_port", 0),
            "dst_port": flow_data.get("dst_port", 0),
            "protocol": flow_data["protocol"],
            "duration": flow_data.get("duration", 0.0),
            "total_bytes": flow_data.get("total_bytes", 0),
            "total_packets": flow_data.get("total_packets", 0),
            "src_bytes": flow_data.get("src_bytes", 0),
            "dst_bytes": flow_data.get("dst_bytes", 0),
            "features": json.dumps(flow_data.get("features", {})),
            "source": flow_data.get("source", "live"),
        }

        result = await self.session.execute(query, params)
        row = result.fetchone()
        flow_id = row[0] if row else "unknown"

        await self.session.commit()
        return flow_id

    async def save_batch(self, flows: List[Dict[str, Any]]) -> int:
        """
        Save a batch of flow records.

        Args:
            flows: List of flow record dicts.

        Returns:
            Number of flows successfully saved.
        """
        saved = 0
        for flow_data in flows:
            try:
                await self.save_flow(flow_data)
                saved += 1
            except Exception as exc:
                logger.error("[Persistence] Failed to save flow: %s", exc)
                await self.session.rollback()

        return saved

    async def get_flow_count(self) -> int:
        """Get total number of flows in the database."""
        query = text("SELECT COUNT(*) FROM network_flows")
        result = await self.session.execute(query)
        row = result.fetchone()
        return row[0] if row else 0

    async def get_anomaly_count(self) -> int:
        """Get count of anomalous flows."""
        query = text("SELECT COUNT(*) FROM network_flows WHERE is_anomaly = true")
        result = await self.session.execute(query)
        row = result.fetchone()
        return row[0] if row else 0