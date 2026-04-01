#!/usr/bin/env python3
"""
ThreatMatrix AI — External Attack Runner (Cross-Platform)
==========================================================

Runs attack simulations against the VPS from an external machine
(your local laptop/desktop). Traffic arrives via the internet through
eth0 on the VPS, where the capture engine will detect it.

Usage:
    python3 run_external_attacks.py [--target 187.124.45.161] [--api http://187.124.45.161:8000]

Works on Windows, macOS, and Linux without additional tools.
Requires: scapy (pip install scapy)
Optional: nmap (for real port scans)
"""

import argparse
import json
import os
import random
import string
import base64
import time
import subprocess
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError

# ANSI colors (work on Windows 10+ with VT processing)
try:
    import colorama
    colorama.init()
except ImportError:
    pass

CYAN = "\033[0;36m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
BOLD = "\033[1m"
NC = "\033[0m"


def api_get(url, token=None):
    """Make a GET request to the ThreatMatrix API."""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}


def get_alert_count(api_url, token=None):
    """Get current total alert count."""
    data = api_get(f"{api_url}/api/v1/alerts/stats", token)
    return data.get("total_alerts", data.get("total", 0))


def get_flow_count(api_url, token=None):
    """Get current total flow count."""
    data = api_get(f"{api_url}/api/v1/flows/stats", token)
    return data.get("total_flows", data.get("total", 0))


def print_header(title, color=CYAN):
    """Print a formatted scenario header."""
    print(f"\n{color}{BOLD}{'━' * 60}")
    print(f"  {title}")
    print(f"{'━' * 60}{NC}\n")


def wait_for_alerts(api_url, token, pre_count, timeout=60, label=""):
    """Poll for new alerts after an attack."""
    print(f"  {YELLOW}Waiting up to {timeout}s for alerts...{NC}")
    for i in range(1, (timeout // 5) + 1):
        time.sleep(5)
        current = get_alert_count(api_url, token)
        new = current - pre_count
        print(f"    [{i}/{timeout // 5}] Alerts: {current} (+{new} new)")

        if new > 0:
            print(f"\n  {GREEN}[+] {new} alert(s) detected!{NC}")
            # Fetch latest alerts
            data = api_get(f"{api_url}/api/v1/alerts/?limit=3", token)
            alerts = data if isinstance(data, list) else data.get("alerts", data.get("items", []))
            for a in alerts[:3]:
                sev = a.get("severity", "?").upper()
                cat = a.get("category", "?")
                title = a.get("title", "?")
                conf = a.get("confidence", 0)
                print(f"    [{sev}] {title}")
                print(f"      Category: {cat} | Confidence: {conf:.0%}")
                narrative = a.get("ai_narrative", "")
                if narrative:
                    print(f"      AI: {narrative[:100]}...")
            return True

    print(f"  {YELLOW}[!] No alerts after {timeout}s{NC}")
    return False


def scenario_port_scan(target, api_url, token):
    """SYN port scan using Scapy."""
    print_header("Scenario 1: Port Scan (SYN)", CYAN)

    try:
        from scapy.all import IP, TCP, send, conf
        conf.verb = 0
    except ImportError:
        print(f"  {RED}[ERROR] scapy not installed. pip install scapy{NC}")
        return False

    pre = get_alert_count(api_url, token)
    print(f"  Pre-attack alerts: {pre}")
    print(f"  Sending SYN packets to {target} ports 1-512...")

    for port in range(1, 513):
        pkt = IP(dst=target) / TCP(sport=random.randint(1024, 65535), dport=port, flags="S")
        send(pkt, verbose=0)
        if port % 100 == 0:
            print(f"    Sent {port}/512...")

    print(f"  {GREEN}[+] 512 SYN packets sent{NC}")
    return wait_for_alerts(api_url, token, pre, timeout=60)


def scenario_ddos(target, api_url, token, duration=10):
    """SYN flood using Scapy."""
    print_header("Scenario 2: DDoS SYN Flood", RED)

    try:
        from scapy.all import IP, TCP, send, conf
        conf.verb = 0
    except ImportError:
        print(f"  {RED}[ERROR] scapy not installed. pip install scapy{NC}")
        return False

    pre = get_alert_count(api_url, token)
    print(f"  Pre-attack alerts: {pre}")
    print(f"  Sending SYN flood to {target}:80 for {duration}s...")

    sent = 0
    start = time.time()
    while time.time() - start < duration:
        for _ in range(100):
            pkt = IP(src=f"10.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}",
                     dst=target) / \
                  TCP(sport=random.randint(1024, 65535), dport=80, flags="S")
            send(pkt, verbose=0)
            sent += 1
        if sent % 5000 == 0:
            print(f"    Sent {sent} packets...")

    print(f"  {GREEN}[+] {sent} SYN packets sent in {duration}s{NC}")
    return wait_for_alerts(api_url, token, pre, timeout=90)


def scenario_dns_tunnel(target, api_url, token, num_queries=60):
    """DNS tunneling using Scapy."""
    print_header("Scenario 3: DNS Tunneling", YELLOW)

    try:
        from scapy.all import IP, UDP, DNS, DNSQR, send, conf
        conf.verb = 0
    except ImportError:
        print(f"  {RED}[ERROR] scapy not installed. pip install scapy{NC}")
        return False

    pre = get_alert_count(api_url, token)
    print(f"  Pre-attack alerts: {pre}")
    print(f"  Sending {num_queries} high-entropy DNS queries to {target}:53...")

    for i in range(num_queries):
        raw = os.urandom(30)
        encoded = base64.b64encode(raw).decode().rstrip("=")
        qname = f"{encoded}.exfil-tunnel-data.net"
        pkt = IP(dst=target) / UDP(sport=random.randint(1024, 65535), dport=53) / \
              DNS(rd=1, qd=DNSQR(qname=qname))
        send(pkt, verbose=0)
        if (i + 1) % 20 == 0:
            print(f"    Sent {i + 1}/{num_queries}...")
        time.sleep(0.05)

    print(f"  {GREEN}[+] {num_queries} DNS tunneling queries sent{NC}")
    return wait_for_alerts(api_url, token, pre, timeout=60)


def scenario_brute_force(target, api_url, token, num_attempts=40):
    """SSH brute force using Scapy."""
    print_header("Scenario 4: SSH Brute Force", CYAN)

    try:
        from scapy.all import IP, TCP, send, conf
        conf.verb = 0
    except ImportError:
        print(f"  {RED}[ERROR] scapy not installed. pip install scapy{NC}")
        return False

    pre = get_alert_count(api_url, token)
    print(f"  Pre-attack alerts: {pre}")
    print(f"  Sending {num_attempts} SYN packets to {target}:22...")

    for i in range(num_attempts):
        pkt = IP(dst=target) / TCP(sport=random.randint(1024, 65535), dport=22, flags="S")
        send(pkt, verbose=0)
        time.sleep(0.1)

    print(f"  {GREEN}[+] {num_attempts} connection attempts sent{NC}")
    return wait_for_alerts(api_url, token, pre, timeout=60)


def scenario_normal_traffic(target, api_url, token):
    """Normal HTTP traffic baseline."""
    print_header("Scenario 5: Normal Traffic (False Positive Check)", GREEN)

    pre = get_alert_count(api_url, token)
    print(f"  Pre-traffic alerts: {pre}")
    print(f"  Sending 20 normal HTTP requests to {api_url}...")

    endpoints = [
        "/api/v1/system/health",
        "/api/v1/flows/?limit=10",
        "/api/v1/alerts/?limit=5",
        "/api/v1/flows/stats",
        "/api/v1/ml/models",
        "/api/v1/capture/status",
    ]

    success = 0
    for i in range(20):
        ep = endpoints[i % len(endpoints)]
        try:
            req = Request(f"{api_url}{ep}", headers={"Authorization": f"Bearer {token}"})
            with urlopen(req, timeout=5) as resp:
                resp.read()
                success += 1
        except Exception:
            pass
        time.sleep(random.uniform(0.5, 1.5))

    print(f"  {GREEN}[+] {success}/20 requests succeeded{NC}")

    time.sleep(30)
    current = get_alert_count(api_url, token)
    new = current - pre

    if new == 0:
        print(f"  {GREEN}[✓] No false positives — PASS{NC}")
        return True
    else:
        print(f"  {RED}[✗] {new} false positive alert(s) — FAIL{NC}")
        return False


def main():
    parser = argparse.ArgumentParser(description="ThreatMatrix AI External Attack Runner")
    parser.add_argument("--target", default="187.124.45.161", help="VPS IP address")
    parser.add_argument("--api", default=None, help="API base URL (default: http://<target>:8000)")
    parser.add_argument("--scenario", type=int, default=0, help="Run specific scenario (1-5, 0=all)")
    args = parser.parse_args()

    target = args.target
    api_url = args.api or f"http://{target}:8000"

    print(f"""
{BOLD}{CYAN}╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — External Attack Runner                    ║
╚══════════════════════════════════════════════════════════════╝{NC}

  Target:  {target}
  API:     {api_url}
  Scenarios: {"All" if args.scenario == 0 else args.scenario}
""")

    # Check scapy
    try:
        import scapy.all
    except ImportError:
        print(f"{RED}[ERROR] scapy not installed. Install with:{NC}")
        print(f"  pip install scapy")
        sys.exit(1)

    # Check API reachability
    print(f"{YELLOW}[*] Checking API connectivity...{NC}")
    health = api_get(f"{api_url}/api/v1/system/health")
    if "error" in health:
        print(f"{RED}[ERROR] Cannot reach API at {api_url}: {health['error']}{NC}")
        sys.exit(1)
    print(f"{GREEN}[+] API reachable{NC}")

    # Authenticate (try common credentials)
    print(f"{YELLOW}[*] Authenticating...{NC}")
    token = None
    for creds in [
        {"email": "admin@threatmatrix.ai", "password": "Demo2026!"},
        {"email": "admin@threatmatrix.local", "password": "admin123"},
        {"email": "admin@admin.com", "password": "admin"},
    ]:
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{api_url}/api/v1/auth/login",
                data=json.dumps(creds).encode(),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                token = data.get("access_token")
                if token:
                    print(f"{GREEN}[+] Authenticated as {creds['email']}{NC}")
                    break
        except Exception:
            continue

    if not token:
        print(f"{YELLOW}[!] Auth failed — trying without token (DEV_MODE){NC}")
        token = "dev-mode"

    # Record baseline
    pre_flows = get_flow_count(api_url, token)
    pre_alerts = get_alert_count(api_url, token)
    print(f"\n{CYAN}Baseline: {pre_flows} flows, {pre_alerts} alerts{NC}")

    # Run scenarios
    results = []
    scenarios = {
        1: ("Port Scan", lambda: scenario_port_scan(target, api_url, token)),
        2: ("DDoS Flood", lambda: scenario_ddos(target, api_url, token)),
        3: ("DNS Tunnel", lambda: scenario_dns_tunnel(target, api_url, token)),
        4: ("SSH Brute Force", lambda: scenario_brute_force(target, api_url, token)),
        5: ("Normal Traffic", lambda: scenario_normal_traffic(target, api_url, token)),
    }

    if args.scenario > 0:
        name, fn = scenarios[args.scenario]
        ok = fn()
        results.append((name, ok))
    else:
        for num, (name, fn) in sorted(scenarios.items()):
            ok = fn()
            results.append((name, ok))
            if num < 5:
                print(f"\n  {YELLOW}Cooling down 30s...{NC}")
                time.sleep(30)

    # Summary
    post_flows = get_flow_count(api_url, token)
    post_alerts = get_alert_count(api_url, token)

    print(f"\n{BOLD}{CYAN}{'═' * 60}")
    print(f"  RESULTS SUMMARY")
    print(f"{'═' * 60}{NC}\n")

    passed = 0
    for name, ok in results:
        status = f"{GREEN}✓ PASS{NC}" if ok else f"{RED}✗ FAIL{NC}"
        print(f"  {status}  {name}")
        if ok:
            passed += 1

    print(f"\n  Flows:  {pre_flows} → {post_flows} (+{post_flows - pre_flows})")
    print(f"  Alerts: {pre_alerts} → {post_alerts} (+{post_alerts - pre_alerts})")
    print(f"\n  {BOLD}Result: {passed}/{len(results)} scenarios detected{NC}")


if __name__ == "__main__":
    main()
