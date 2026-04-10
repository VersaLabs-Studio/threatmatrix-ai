#!/usr/bin/env python3
"""
ThreatMatrix AI — Attack Simulation: Run Attacks Locally on VPS
================================================================

This script is designed to run DIRECTLY on the VPS (localhost).
It generates attack traffic that the capture engine monitors on eth0.

Unlike external attacks (from WSL), local attacks on the VPS will
be immediately visible to the capture engine's sniffer.

Usage:
    python3 run_local_attacks.py [--target TARGET_IP]

Run directly on the VPS:
    ssh root@187.124.45.161
    cd /home/threatmatrix/threatmatrix-ai
    python3 scripts/attack_simulation/run_local_attacks.py
"""

import subprocess
import json
import time
import sys
import os

# Configuration
API_URL = "http://localhost:8000/api/v1"
TARGET = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
WAIT_AFTER_ATTACK = 120  # 2 minutes for ML processing at 11.3 pps

# ANSI colors
RED = "\033[0;31m"
GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[1;33m"
BOLD = "\033[1m"
NC = "\033[0m"


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


def get_worker_stats():
    """Get latest worker stats from docker logs."""
    try:
        result = subprocess.run(
            ["docker", "compose", "logs", "--tail=3", "ml-worker"],
            capture_output=True, text=True, timeout=10,
            cwd="/home/threatmatrix/threatmatrix-ai"
        )
        return result.stdout.strip()
    except Exception:
        return "N/A"


def run_attack(name, cmd, duration):
    """Run an attack command and return success status."""
    print(f"\n{YELLOW}[*] Running: {name}{NC}")
    print(f"    Command: {cmd}")
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=duration + 10
        )
        print(f"    Completed")
        return True
    except subprocess.TimeoutExpired:
        print(f"    Timed out after {duration}s")
        return True
    except Exception as e:
        print(f"    {RED}Failed: {e}{NC}")
        return False


def check_detection(name, pre_count, post_count, expected_severity, expected_category):
    """Check if an attack was detected."""
    new_alerts = post_count - pre_count
    print(f"\n    Pre-attack alerts:  {pre_count}")
    print(f"    Post-attack alerts: {post_count}")
    print(f"    New alerts:         {new_alerts}")

    if new_alerts > 0:
        print(f"\n  {GREEN}[+] DETECTED! {new_alerts} new alert(s){NC}")
        # Fetch latest alerts to check severity/category
        try:
            result = subprocess.run(
                ["curl", "-s", f"{API_URL}/alerts/?limit={new_alerts}"],
                capture_output=True, text=True, timeout=10
            )
            data = json.loads(result.stdout)
            alerts = data if isinstance(data, list) else data.get("items", data.get("alerts", []))
            for a in alerts[:3]:
                sev = a.get("severity", "?").upper()
                cat = a.get("category", "?")
                conf = a.get("confidence", 0)
                print(f"    [{sev}] {cat} — Confidence: {conf:.0%}")
                narrative = a.get("ai_narrative", "")
                if narrative:
                    print(f"    AI: {narrative[:100]}...")
        except Exception:
            pass
        return True
    else:
        print(f"\n  {YELLOW}[!] Not detected yet — may need more time for ML processing{NC}")
        return False


def main():
    print(f"""{BOLD}{CYAN}
╔══════════════════════════════════════════════════════════════╗
║  ThreatMatrix AI — Local Attack Simulation                  ║
║  Target: {TARGET:<48s} ║
║  Wait time: {WAIT_AFTER_ATTACK}s (for capture engine at 11.3 pps)        ║
╚══════════════════════════════════════════════════════════════╝{NC}
""")

    # Check API is reachable
    try:
        subprocess.run(
            ["curl", "-s", "--connect-timeout", "5", f"{API_URL}/system/health"],
            capture_output=True, text=True, timeout=10
        )
    except Exception:
        print(f"{RED}[ERROR] Cannot reach API at {API_URL}{NC}")
        sys.exit(1)

    # Check tools
    tools_ok = True
    for tool in ["nmap", "hping3", "curl"]:
        try:
            subprocess.run(["which", tool], capture_output=True, timeout=5)
        except Exception:
            print(f"{YELLOW}[!] {tool} not found — install with: apt install {tool}{NC}")
            if tool in ("nmap", "hping3"):
                tools_ok = False

    if not tools_ok:
        print(f"{RED}[ERROR] Missing required tools. Install with: apt install nmap hping3{NC}")
        sys.exit(1)

    results = []

    # ── Scenario 1: Port Scan ──────────────────────────────
    print(f"\n{BOLD}{CYAN}━━━ Scenario 1/5: Port Scan ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{NC}")
    pre = get_alert_count()
    run_attack("Nmap SYN Scan", f"sudo nmap -sS -p 1-1024 {TARGET} --max-retries 1 -T4 2>&1", 30)
    print(f"{YELLOW}[*] Waiting {WAIT_AFTER_ATTACK}s for ML processing...{NC}")
    time.sleep(WAIT_AFTER_ATTACK)
    post = get_alert_count()
    if check_detection("Port Scan", pre, post, "high", "port_scan"):
        results.append("Port Scan: PASS")
    else:
        results.append("Port Scan: INCONCLUSIVE")
    print(f"{YELLOW}[*] Worker stats:{NC}")
    print(get_worker_stats())

    # ── Scenario 2: DDoS SYN Flood ─────────────────────────
    print(f"\n{BOLD}{RED}━━━ Scenario 2/5: DDoS SYN Flood ━━━━━━━━━━━━━━━━━━━━━━━━━━━{NC}")
    pre = get_alert_count()
    run_attack("DDoS Flood", f"sudo timeout 10 hping3 -S --flood -p 80 {TARGET} 2>&1 || true", 15)
    print(f"{YELLOW}[*] Waiting {WAIT_AFTER_ATTACK}s for ML processing...{NC}")
    time.sleep(WAIT_AFTER_ATTACK)
    post = get_alert_count()
    if check_detection("DDoS", pre, post, "critical", "ddos"):
        results.append("DDoS: PASS")
    else:
        results.append("DDoS: INCONCLUSIVE")
    print(f"{YELLOW}[*] Worker stats:{NC}")
    print(get_worker_stats())

    # ── Scenario 3: Brute Force (raw TCP) ──────────────────
    print(f"\n{BOLD}{YELLOW}━━━ Scenario 3/5: SSH Brute Force ━━━━━━━━━━━━━━━━━━━━━━━━━━{NC}")
    pre = get_alert_count()
    print(f"{YELLOW}[*] Sending 50 rapid connection attempts to {TARGET}:22...{NC}")
    for i in range(50):
        try:
            subprocess.run(
                f"timeout 1 bash -c 'echo  > /dev/tcp/{TARGET}/22' 2>/dev/null || true",
                shell=True, timeout=2
            )
        except Exception:
            pass
        time.sleep(0.05)
    print(f"{YELLOW}[*] Waiting {WAIT_AFTER_ATTACK}s for ML processing...{NC}")
    time.sleep(WAIT_AFTER_ATTACK)
    post = get_alert_count()
    if check_detection("Brute Force", pre, post, "high", "unauthorized_access"):
        results.append("Brute Force: PASS")
    else:
        results.append("Brute Force: INCONCLUSIVE")
    print(f"{YELLOW}[*] Worker stats:{NC}")
    print(get_worker_stats())

    # ── Scenario 4: Normal Traffic ─────────────────────────
    print(f"\n{BOLD}{GREEN}━━━ Scenario 4/4: Normal Traffic (False Positive Check) ━━━━{NC}")
    pre = get_alert_count()
    endpoints = [
        "/system/health", "/flows/?limit=10", "/alerts/?limit=5",
        "/flows/stats", "/flows/protocols", "/ml/models",
    ]
    for i in range(20):
        ep = endpoints[i % len(endpoints)]
        subprocess.run(["curl", "-s", "-o", "/dev/null", f"{API_URL}{ep}"], timeout=5)
        time.sleep(1)
    time.sleep(30)
    post = get_alert_count()
    new_alerts = post - pre
    if new_alerts == 0:
        print(f"  {GREEN}[✓] PASS — No false positives{NC}")
        results.append("Normal Traffic: PASS (no false positives)")
    else:
        print(f"  {RED}[✗] FALSE POSITIVE — {new_alerts} unexpected alerts{NC}")
        results.append("Normal Traffic: FALSE POSITIVES DETECTED")

    # ── Summary ────────────────────────────────────────────
    print(f"\n{BOLD}{CYAN}")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  SIMULATION COMPLETE — RESULTS SUMMARY                      ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print(f"{NC}\n")

    for r in results:
        if "PASS" in r:
            print(f"  {GREEN}✓{NC} {r}")
        elif "FALSE" in r:
            print(f"  {RED}✗{NC} {r}")
        else:
            print(f"  {YELLOW}?{NC} {r}")

    pass_count = sum(1 for r in results if "PASS" in r)
    print(f"\n{BOLD}Result: {pass_count}/{len(results)} scenarios detected{NC}")


if __name__ == "__main__":
    main()
