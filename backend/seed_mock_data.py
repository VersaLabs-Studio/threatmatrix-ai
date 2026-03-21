#!/usr/bin/env python3
"""
ThreatMatrix AI — Mock Data Seeder
Populates the database with realistic mock data for visual demo.
"""

import asyncio
import json
import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import async_session
from app.redis import redis_manager
from sqlalchemy import text

# We'll use raw SQL for both flows and alerts to avoid relationship loading issues
from app.models.base import Base

# ── Realistic IP addresses ──────────────────────────────────────────
INTERNAL_IPS = [
    "10.0.1.5", "10.0.1.12", "10.0.1.23", "10.0.1.45", "10.0.1.67",
    "10.0.1.89", "10.0.1.100", "10.0.1.150", "10.0.1.200", "10.0.1.250",
]

EXTERNAL_IPS = [
    # Known legitimate
    "8.8.8.8", "8.8.4.4", "1.1.1.1", "9.9.9.9",
    # Suspicious / attacker IPs
    "185.220.101.34", "45.33.32.156", "198.51.100.42", "203.0.113.100",
    "192.0.2.100", "198.18.0.50", "203.0.113.200", "45.77.65.211",
    "104.248.50.87", "167.99.87.42", "159.89.104.33", "142.93.215.78",
]

COUNTRIES = {
    "10.0.1.5": "ET", "10.0.1.12": "ET", "10.0.1.23": "ET",
    "185.220.101.34": "RU", "45.33.32.156": "US", "198.51.100.42": "CN",
    "203.0.113.100": "BR", "192.0.2.100": "DE", "198.18.0.50": "US",
    "203.0.113.200": "IN", "45.77.65.211": "SG", "104.248.50.87": "US",
    "167.99.87.42": "NL", "159.89.104.33": "US", "142.93.215.78": "US",
}

PROTOCOLS = {6: "TCP", 17: "UDP", 1: "ICMP"}

ATTACK_TYPES = ["ddos", "port_scan", "c2", "dns_tunnel", "brute_force", "malware"]
ATTACK_LABELS = {
    "ddos": "DDoS Amplification",
    "port_scan": "Port Sweep",
    "c2": "Command & Control",
    "dns_tunnel": "DNS Tunneling",
    "brute_force": "Brute Force SSH",
    "malware": "Malware Download",
}

SEVERITIES = ["critical", "high", "medium", "low", "info"]
STATUSES = ["open", "acknowledged", "investigating", "resolved", "false_positive"]


def generate_flow_features(is_anomaly: bool, attack_type: str | None = None) -> dict:
    """Generate realistic 40+ feature vector."""
    base = {
        "duration": random.uniform(0.001, 120.0),
        "src_bytes": random.randint(40, 50000),
        "dst_bytes": random.randint(40, 50000),
        "total_packets": random.randint(2, 500),
        "mean_iat": random.uniform(0.001, 0.5),
        "std_iat": random.uniform(0.0001, 0.1),
        "min_iat": random.uniform(0.0001, 0.01),
        "max_iat": random.uniform(0.01, 1.0),
        "syn_count": random.randint(0, 10),
        "ack_count": random.randint(0, 50),
        "fin_count": random.randint(0, 5),
        "rst_count": random.randint(0, 3),
        "psh_count": random.randint(0, 20),
        "urg_count": random.randint(0, 2),
        "payload_entropy": random.uniform(0.1, 8.0),
        "mean_payload_size": random.randint(20, 1500),
        "packets_per_second": random.uniform(0.1, 1000.0),
        "bytes_per_packet": random.randint(40, 1500),
    }
    
    if is_anomaly and attack_type:
        if attack_type == "ddos":
            base["packets_per_second"] = random.uniform(500, 5000)
            base["total_packets"] = random.randint(1000, 10000)
            base["syn_count"] = random.randint(500, 5000)
        elif attack_type == "port_scan":
            base["syn_count"] = random.randint(100, 1000)
            base["rst_count"] = random.randint(50, 500)
            base["duration"] = random.uniform(0.01, 1.0)
        elif attack_type == "dns_tunnel":
            base["payload_entropy"] = random.uniform(6.5, 8.0)
            base["dst_bytes"] = random.randint(5000, 50000)
        elif attack_type == "brute_force":
            base["total_packets"] = random.randint(50, 200)
            base["src_bytes"] = random.randint(5000, 20000)
            base["dst_bytes"] = random.randint(1000, 5000)
    
    return base


async def seed_flows(session, count: int = 500):
    """Generate realistic network flows using raw SQL."""
    now = datetime.now(timezone.utc)
    flow_ids = []
    anomaly_count = 0
    
    for i in range(count):
        is_anomaly = random.random() < 0.08
        attack_type = random.choice(ATTACK_TYPES) if is_anomaly else None
        
        src_ip = random.choice(INTERNAL_IPS)
        dst_ip = random.choice(EXTERNAL_IPS)
        protocol = random.choice(list(PROTOCOLS.keys()))
        src_port = random.randint(1024, 65535)
        dst_port = random.choice([80, 443, 22, 53, 8080, 3389, 445, 25, 110, 993])
        
        features = generate_flow_features(is_anomaly, attack_type)
        
        anomaly_score = (
            random.uniform(0.7, 0.99) if is_anomaly
            else random.uniform(0.01, 0.25)
        )
        
        flow_id = uuid4()
        timestamp = now - timedelta(seconds=random.randint(0, 3600))
        total_bytes = features["src_bytes"] + features["dst_bytes"]
        ml_model = random.choice(["isolation_forest", "random_forest", "autoencoder"]) if is_anomaly else None
        
        await session.execute(
            text("""
                INSERT INTO network_flows (
                    id, timestamp, src_ip, dst_ip, src_port, dst_port, protocol,
                    duration, total_bytes, total_packets, src_bytes, dst_bytes,
                    features, anomaly_score, is_anomaly, ml_model, label, source, created_at
                ) VALUES (
                    :id, :timestamp, :src_ip, :dst_ip, :src_port, :dst_port, :protocol,
                    :duration, :total_bytes, :total_packets, :src_bytes, :dst_bytes,
                    :features, :anomaly_score, :is_anomaly, :ml_model, :label, :source, NOW()
                )
            """),
            {
                "id": str(flow_id),
                "timestamp": timestamp,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": protocol,
                "duration": features["duration"],
                "total_bytes": total_bytes,
                "total_packets": features["total_packets"],
                "src_bytes": features["src_bytes"],
                "dst_bytes": features["dst_bytes"],
                "features": json.dumps(features),  # Serialize dict to JSON string
                "anomaly_score": anomaly_score,
                "is_anomaly": is_anomaly,
                "ml_model": ml_model,
                "label": attack_type,
                "source": "live",
            }
        )
        
        flow_ids.append({
            "id": flow_id,
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "protocol": protocol,
            "total_bytes": total_bytes,
            "anomaly_score": anomaly_score,
            "is_anomaly": is_anomaly,
            "label": attack_type,
            "timestamp": timestamp,
            "ml_model": ml_model,
        })
        
        if is_anomaly:
            anomaly_count += 1
    
    await session.commit()
    print(f"✅ Seeded {count} flows ({anomaly_count} anomalies)")
    return flow_ids


async def seed_alerts(session, flows: list[dict], count: int = 25):
    """Generate realistic security alerts using raw SQL."""
    anomaly_flows = [f for f in flows if f["is_anomaly"]]
    alerts_created = 0
    
    for i in range(min(count, len(anomaly_flows))):
        flow = anomaly_flows[i]
        attack_type = flow["label"] or "unknown"
        severity = random.choices(SEVERITIES, weights=[10, 20, 30, 25, 15], k=1)[0]
        status = random.choices(STATUSES, weights=[40, 25, 20, 10, 5], k=1)[0]
        
        alert_id_str = f"TM-ALERT-{i + 1:05d}"
        title = ATTACK_LABELS.get(attack_type, f"Suspicious Activity: {attack_type}")
        description = f"Detected {attack_type} pattern from {flow['src_ip']} to {flow['dst_ip']}"
        ai_narrative = (
            f"Analysis indicates {attack_type} activity with {flow['anomaly_score']:.0%} confidence. "
            f"Source IP {flow['src_ip']} shows patterns consistent with known attack signatures."
        )
        
        await session.execute(
            text("""
                INSERT INTO alerts (
                    id, alert_id, severity, title, description, category,
                    source_ip, dest_ip, confidence, status, ml_model,
                    ai_narrative, flow_ids, created_at, updated_at
                ) VALUES (
                    :id, :alert_id, :severity, :title, :description, :category,
                    :source_ip, :dest_ip, :confidence, :status, :ml_model,
                    :ai_narrative, :flow_ids, NOW(), NOW()
                )
            """),
            {
                "id": str(uuid4()),
                "alert_id": alert_id_str,
                "severity": severity,
                "title": title,
                "description": description,
                "category": attack_type,
                "source_ip": flow["src_ip"],
                "dest_ip": flow["dst_ip"],
                "confidence": flow["anomaly_score"],
                "status": status,
                "ml_model": flow["ml_model"],
                "ai_narrative": ai_narrative,
                "flow_ids": [str(flow["id"])],
            }
        )
        alerts_created += 1
    
    await session.commit()
    print(f"✅ Seeded {alerts_created} alerts")
    return alerts_created


async def publish_to_redis(flows: list[dict], alerts_created: int):
    """Publish recent data to Redis channels for WebSocket broadcasting."""
    await redis_manager.connect()
    
    for flow in flows[-5:]:
        await redis_manager.publish("flows:live", {
            "id": str(flow["id"]),
            "src_ip": flow["src_ip"],
            "dst_ip": flow["dst_ip"],
            "protocol": PROTOCOLS.get(flow["protocol"], "Other"),
            "bytes": flow["total_bytes"],
            "anomaly_score": flow["anomaly_score"],
            "is_anomaly": flow["is_anomaly"],
            "label": flow["label"] or "",
            "timestamp": flow["timestamp"].isoformat(),
        })
    
    # Publish a sample alert event
    if alerts_created > 0:
        sample_flow = [f for f in flows if f["is_anomaly"]][0] if any(f["is_anomaly"] for f in flows) else flows[0]
        await redis_manager.publish("alerts:live", {
            "id": str(uuid4()),
            "severity": random.choice(SEVERITIES),
            "category": sample_flow["label"] or "unknown",
            "src_ip": sample_flow["src_ip"],
            "dst_ip": sample_flow["dst_ip"],
            "composite_score": sample_flow["anomaly_score"],
            "timestamp": sample_flow["timestamp"].isoformat(),
            "status": "open",
        })
    
    print(f"✅ Published to Redis channels")


async def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  ThreatMatrix AI — Mock Data Seeder                        ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    async with async_session() as session:
        flows = await seed_flows(session, count=500)
        alerts_created = await seed_alerts(session, flows, count=25)
        await publish_to_redis(flows, alerts_created)
    
    print()
    print("🎯 Mock data seeding complete!")
    print("   Open http://localhost:3000/war-room to see live data")


if __name__ == "__main__":
    asyncio.run(main())