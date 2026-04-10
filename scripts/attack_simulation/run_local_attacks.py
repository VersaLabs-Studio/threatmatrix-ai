#!/usr/bin/env python3
"""
ThreatMatrix AI — Local Attack Simulation (VPS Internal)
==========================================================

Run DIRECTLY on the VPS to generate attack traffic captured by
both eth0 and loopback capture engines.

Usage (on VPS):
    python3 scripts/attack_simulation/run_local_attacks.py
    python3 scripts/attack_simulation/run_local_attacks.py --target 127.0.0.1
    python3 scripts/attack_simulation/run_local_attacks.py --scenario 1
"""

import subprocess
import json
import time
import sys
import os
import argparse

API_URL = "http://localhost:8000/api/v1"

# ANSI colors
RED = "\033[0;31m"
GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[1;33m"
BOLD = "\033[1m"
NC = "\033[0m"

# Wait between attack and check — capture engine processes at ~40-80 pps,
# flows timeout after 10s active / 15s idle, so 30s is enough.
WAIT_AFTER_ATTACK = 30


def api_get(path):
    """GET from ThreatMatrix API."""
    try:
        result = subprocess.run(
            ["curl", "-s", f"{API_URL}{path}"],
            capture_output=True, text=True, timeout=10
        )
        return json.loads(result.stdout)
    except Exception:
        return {}


def get_alert_stats():
    """Get alert severity breakdown."""
    return api_get("/alerts/stats")


def get_severity_counts():
    """Get severity breakdown as dict."""
    stats = get_alert_stats()
    return stats.get("by_severity", {})


def print_header(title, color=CYAN):
    """Print a formatted scenario header."""
    print(f"\n{color}{BOLD}{'━' * 60}")
    print(f"  {title}")
    print(f"{'━' * 60}{NC}\n")


def run_cmd(cmd, timeout=30, shell=True):
    """Run a command, return (success, stdout)."""
    try:
        r = subprocess.run(
            cmd, shell=shell, capture_output=True, text=True, timeout=timeout
        )
        return True, r.stdout
    except subprocess.TimeoutExpired:
        return True, "(timed out)"
    except Exception as e:
        return False, str(e)


def wait_and_check(pre_stats, scenario_name, expected_sev, expected_cat):
    """Wait for ML processing then check for new alerts."""
    print(f"\n  {YELLOW}⏳ Waiting {WAIT_AFTER_ATTACK}s for capture→ML→alert pipeline...{NC}")
    time.sleep(WAIT_AFTER_ATTACK)

    post_stats = get_alert_stats()
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

    # Check category
    pre_cat = pre_stats.get("by_category", {})
    post_cat = post_stats.get("by_category", {})
    if expected_cat:
        pre_cc = pre_cat.get(expected_cat, 0)
        post_cc = post_cat.get(expected_cat, 0)
        cat_delta = post_cc - pre_cc
        print(f"  Category '{expected_cat}': {pre_cc} → {post_cc} (+{cat_delta})")

    # Show latest worker logs for score visibility
    try:
        r = subprocess.run(
            ["docker", "compose", "logs", "--tail=5", "ml-worker"],
            capture_output=True, text=True, timeout=10,
            cwd="/home/threatmatrix/threatmatrix-ai"
        )
        lines = [l for l in r.stdout.strip().split("\n") if "ALERT:" in l or "scores:" in l]
        if lines:
            print(f"\n  {BOLD}Latest ML Worker Output:{NC}")
            for line in lines[-3:]:
                # Clean up container prefix
                clean = line.split("|", 1)[-1].strip() if "|" in line else line.strip()
                print(f"    {clean}")
    except Exception:
        pass

    if new_alerts > 0:
        # Check if expected severity was hit
        expected_delta = post_sev.get(expected_sev, 0) - pre_sev.get(expected_sev, 0)
        if expected_delta > 0:
            print(f"\n  {GREEN}✅ PASS — {new_alerts} alert(s), {expected_sev.upper()} severity detected{NC}")
            return "PASS"
        else:
            # Got alerts but different severity — still useful
            gained_sevs = [s for s in ["critical", "high", "medium", "low"]
                          if post_sev.get(s, 0) > pre_sev.get(s, 0)]
            print(f"\n  {YELLOW}⚠ PARTIAL — {new_alerts} alert(s) as {', '.join(s.upper() for s in gained_sevs)}"
                  f" (expected {expected_sev.upper()}){NC}")
            return "PARTIAL"
    else:
        print(f"\n  {RED}✗ NOT DETECTED — 0 new alerts{NC}")
        return "FAIL"


# ══════════════════════════════════════════════════════════════
# Attack Scenarios
# ══════════════════════════════════════════════════════════════

def scenario_port_scan(target):
    """Scenario 1: Nmap SYN scan → expect HIGH/CRITICAL probe alerts."""
    print_header("Scenario 1: Port Scan (nmap SYN scan)", CYAN)
    print(f"  Target: {target}")
    print(f"  Expected: HIGH severity, category=port_scan")

    pre = get_alert_stats()
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")

    # Full SYN scan of well-known ports
    print(f"\n  {YELLOW}[*] Running: nmap -sS -p 1-1024 {target} -T4{NC}")
    run_cmd(f"nmap -sS -p 1-1024 {target} --max-retries 1 -T4", timeout=60)

    # Additional aggressive scan for more flow diversity
    print(f"  {YELLOW}[*] Running: nmap -sS -p 1-100 {target} -T5 --max-retries 3{NC}")
    run_cmd(f"nmap -sS -p 1-100 {target} --max-retries 3 -T5", timeout=30)

    return wait_and_check(pre, "Port Scan", "high", "port_scan")


def scenario_ddos(target):
    """Scenario 2: DDoS SYN flood → expect CRITICAL dos alerts."""
    print_header("Scenario 2: DDoS SYN Flood (hping3)", RED)
    print(f"  Target: {target}:80")
    print(f"  Expected: CRITICAL severity, category=ddos")

    pre = get_alert_stats()
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")

    # SYN flood for 10 seconds
    print(f"\n  {YELLOW}[*] Running: hping3 -S --flood -p 80 {target} (10s){NC}")
    run_cmd(f"timeout 10 hping3 -S --flood -p 80 {target} 2>&1 || true", timeout=15)

    # Additional targeted flood on different ports
    print(f"  {YELLOW}[*] Running: hping3 -S --flood -p 443 {target} (5s){NC}")
    run_cmd(f"timeout 5 hping3 -S --flood -p 443 {target} 2>&1 || true", timeout=10)

    return wait_and_check(pre, "DDoS SYN Flood", "critical", "ddos")


def scenario_brute_force(target):
    """Scenario 3: SSH brute force → expect HIGH r2l/unauthorized_access alerts."""
    print_header("Scenario 3: SSH Brute Force", YELLOW)
    print(f"  Target: {target}:22")
    print(f"  Expected: HIGH severity, category=unauthorized_access")

    pre = get_alert_stats()
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")

    # Rapid SSH connection attempts
    print(f"\n  {YELLOW}[*] Sending 100 rapid TCP SYN to port 22...{NC}")
    for i in range(100):
        run_cmd(f"timeout 1 bash -c 'echo > /dev/tcp/{target}/22' 2>/dev/null || true", timeout=2)
        if (i + 1) % 25 == 0:
            print(f"    Sent {i + 1}/100...")
        time.sleep(0.02)

    # Also try with hping3 for more volume
    print(f"  {YELLOW}[*] Running: hping3 -S -p 22 -c 200 --fast {target}{NC}")
    run_cmd(f"hping3 -S -p 22 -c 200 --fast {target} 2>&1 || true", timeout=30)

    return wait_and_check(pre, "SSH Brute Force", "high", "unauthorized_access")


def scenario_multi_port_probe(target):
    """Scenario 4: Multi-vector probe → expect HIGH probe alerts."""
    print_header("Scenario 4: Multi-Vector Reconnaissance", CYAN)
    print(f"  Target: {target}")
    print(f"  Expected: HIGH severity, category=port_scan")

    pre = get_alert_stats()
    print(f"  Pre-attack alerts: {pre.get('total', 0)}")

    # Service detection scan
    print(f"\n  {YELLOW}[*] Running: nmap -sV -p 22,80,443,8000,5432,6379 {target}{NC}")
    run_cmd(f"nmap -sV -p 22,80,443,8000,5432,6379 {target} -T4", timeout=60)

    # UDP scan
    print(f"  {YELLOW}[*] Running: nmap -sU -p 53,123,161 {target}{NC}")
    run_cmd(f"nmap -sU -p 53,123,161 {target} --max-retries 1 -T4", timeout=30)

    # XMAS scan
    print(f"  {YELLOW}[*] Running: nmap -sX -p 1-100 {target}{NC}")
    run_cmd(f"nmap -sX -p 1-100 {target} --max-retries 1 -T4", timeout=30)

    return wait_and_check(pre, "Multi-Vector Probe", "high", "port_scan")


def scenario_normal_traffic(target):
    """Scenario 5: Normal traffic → expect NO new alerts (false positive check)."""
    print_header("Scenario 5: Normal Traffic (False Positive Check)", GREEN)
    print(f"  Expected: NO new alerts")

    pre = get_alert_stats()
    pre_total = pre.get("total", 0)
    print(f"  Pre-traffic alerts: {pre_total}")

    # Normal API requests
    endpoints = [
        "/system/health", "/flows/?limit=10", "/alerts/?limit=5",
        "/flows/stats", "/flows/protocols", "/ml/models",
    ]
    print(f"\n  {YELLOW}[*] Sending 20 normal API requests...{NC}")
    for i in range(20):
        ep = endpoints[i % len(endpoints)]
        run_cmd(f"curl -s -o /dev/null {API_URL}{ep}", timeout=5)
        time.sleep(0.5)

    time.sleep(20)
    post = get_alert_stats()
    post_total = post.get("total", 0)
    new_alerts = post_total - pre_total

    if new_alerts == 0:
        print(f"\n  {GREEN}✅ PASS — No false positives{NC}")
        return "PASS"
    else:
        print(f"\n  {RED}✗ FALSE POSITIVES — {new_alerts} unexpected alerts{NC}")
        return "FALSE_POS"


def main():
    parser = argparse.ArgumentParser(description="ThreatMatrix AI — Local Attack Simulation")
    parser.add_argument("--target", default="127.0.0.1", help="Target IP (default: 127.0.0.1)")
    parser.add_argument("--scenario", type=int, default=0,
                       help="Run specific scenario (1-5, 0=all)")
    parser.add_argument("--wait", type=int, default=30,
                       help="Seconds to wait after each attack (default: 30)")
    args = parser.parse_args()

    global WAIT_AFTER_ATTACK
    WAIT_AFTER_ATTACK = args.wait
    target = args.target

    print(f"""{BOLD}{CYAN}
╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — Local Attack Simulation                  ║
║  Target: {target:<48s} ║
║  Wait: {WAIT_AFTER_ATTACK}s per scenario                                    ║
╚══════════════════════════════════════════════════════════════╝{NC}
""")

    # Check API
    health = api_get("/system/health")
    if not health:
        print(f"{RED}[ERROR] Cannot reach API at {API_URL}{NC}")
        sys.exit(1)
    print(f"{GREEN}[+] API reachable{NC}")

    # Check tools
    for tool in ["nmap", "hping3"]:
        r = subprocess.run(["which", tool], capture_output=True, timeout=5)
        if r.returncode != 0:
            print(f"{YELLOW}[!] {tool} not found — install with: apt install {tool}{NC}")

    # Initial stats
    stats = get_alert_stats()
    print(f"\n{CYAN}Baseline: {stats.get('total', 0)} total alerts{NC}")
    sev = stats.get("by_severity", {})
    for s in ["critical", "high", "medium", "low"]:
        print(f"  {s.upper():10s}: {sev.get(s, 0)}")

    # Run scenarios
    scenarios = {
        1: ("Port Scan",          lambda: scenario_port_scan(target)),
        2: ("DDoS SYN Flood",     lambda: scenario_ddos(target)),
        3: ("SSH Brute Force",    lambda: scenario_brute_force(target)),
        4: ("Multi-Vector Probe", lambda: scenario_multi_port_probe(target)),
        5: ("Normal Traffic",     lambda: scenario_normal_traffic(target)),
    }

    results = []
    if args.scenario > 0:
        name, fn = scenarios[args.scenario]
        result = fn()
        results.append((name, result))
    else:
        for num, (name, fn) in sorted(scenarios.items()):
            result = fn()
            results.append((name, result))
            if num < 5:
                print(f"\n  {YELLOW}Cooldown 10s...{NC}")
                time.sleep(10)

    # Final Summary
    final_stats = get_alert_stats()
    final_sev = final_stats.get("by_severity", {})

    print(f"\n{BOLD}{CYAN}{'═' * 60}")
    print(f"  ATTACK SIMULATION — FINAL RESULTS")
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
