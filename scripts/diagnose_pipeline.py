#!/usr/bin/env python3
"""
ThreatMatrix AI — Pipeline Diagnostic
======================================

Verify the full pipeline is working:
1. Capture engine sees packets
2. Flows are being published to Redis
3. ML worker receives and scores flows
4. Alerts are generated

Run on the VPS:
    python3 scripts/diagnose_pipeline.py
"""

import redis
import json
import time
import subprocess

API_URL = "http://localhost:8000/api/v1"
REDIS_URL = "redis://localhost:6379"

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[1;33m"
CYAN = "\033[0;36m"
NC = "\033[0m"

def check_api():
    """Check API health."""
    print(f"{CYAN}[*] API Health Check{NC}")
    try:
        result = subprocess.run(
            ["curl", "-s", "--connect-timeout", "5", f"{API_URL}/system/health"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            print(f"  {GREEN}✓ API reachable{NC}")
            return True
        else:
            print(f"  {RED}✗ API unreachable{NC}")
            return False
    except Exception:
        print(f"  {RED}✗ API unreachable{NC}")
        return False

def check_redis_messages():
    """Check if Redis has flows:live messages."""
    print(f"\n{CYAN}[*] Redis Pub/Sub Check{NC}")
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
        r.ping()

        # Check subscriber count
        pubsub_info = r.execute_command("PUBSUB", "NUMSUB", "flows:live")
        sub_count = int(pubsub_info[1])
        print(f"  flows:live subscribers: {sub_count}")

        if sub_count == 0:
            print(f"  {RED}✗ No subscribers to flows:live — ML worker not listening{NC}")
            r.close()
            return False

        # Listen for 10 seconds
        print(f"  {YELLOW}Listening for flows:live messages (10s)...{NC}")
        pubsub = r.pubsub()
        pubsub.subscribe("flows:live")
        start = time.time()
        count = 0
        while time.time() - start < 10:
            msg = pubsub.get_message(timeout=1)
            if msg and msg["type"] == "message":
                count += 1
                data = json.loads(msg["data"])
                event = data.get("event", "?")
                if count == 1:
                    print(f"  First message: event={event}")

        pubsub.unsubscribe()
        r.close()

        if count > 0:
            print(f"  {GREEN}✓ {count} messages received in 10s ({count/10:.1f} msg/s){NC}")
            return True
        else:
            print(f"  {RED}✗ No messages in 10s — capture engine not publishing{NC}")
            return False
    except Exception as e:
        print(f"  {RED}✗ Redis error: {e}{NC}")
        return False

def check_ml_worker():
    """Check ML worker logs."""
    print(f"\n{CYAN}[*] ML Worker Status{NC}")
    try:
        result = subprocess.run(
            ["docker", "compose", "logs", "--tail=5", "ml-worker"],
            capture_output=True, text=True, timeout=10,
            cwd="/home/threatmatrix/threatmatrix-ai"
        )
        lines = result.stdout.strip().split("\n")
        for line in lines[-3:]:
            if line.strip():
                print(f"  {line.strip()}")
        if "scored" in result.stdout.lower():
            return True
        else:
            print(f"  {YELLOW}[!] Worker may be idle{NC}")
            return False
    except Exception as e:
        print(f"  {RED}✗ Error: {e}{NC}")
        return False

def check_alerts():
    """Check alert stats."""
    print(f"\n{CYAN}[*] Alert Stats{NC}")
    try:
        result = subprocess.run(
            ["curl", "-s", f"{API_URL}/alerts/stats"],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        total = data.get("total", 0)
        by_severity = data.get("by_severity", {})
        print(f"  Total alerts: {total}")
        for sev in ["critical", "high", "medium", "low"]:
            count = by_severity.get(sev, 0)
            if count > 0:
                print(f"  {sev.upper()}: {count}")
        return total > 0
    except Exception as e:
        print(f"  {RED}✗ Error: {e}{NC}")
        return False

def check_containers():
    """Check container status."""
    print(f"{CYAN}[*] Container Status{NC}")
    try:
        result = subprocess.run(
            ["docker", "compose", "ps", "--format", "table {{.Name}}\t{{.Status}}"],
            capture_output=True, text=True, timeout=10,
            cwd="/home/threatmatrix/threatmatrix-ai"
        )
        for line in result.stdout.strip().split("\n"):
            print(f"  {line}")
        return True
    except Exception as e:
        print(f"  {RED}✗ Error: {e}{NC}")
        return False

def main():
    print(f"\n{CYAN}╔══════════════════════════════════════════════════════════════╗")
    print(f"║  ThreatMatrix AI — Pipeline Diagnostic                      ║")
    print(f"╚══════════════════════════════════════════════════════════════╝{NC}\n")

    results = {}
    results["containers"] = check_containers()
    results["api"] = check_api()
    results["redis"] = check_redis_messages()
    results["worker"] = check_ml_worker()
    results["alerts"] = check_alerts()

    print(f"\n{CYAN}━━━ Diagnostic Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{NC}")
    for name, passed in results.items():
        status = f"{GREEN}✓ PASS{NC}" if passed else f"{RED}✗ FAIL{NC}"
        print(f"  {name}: {status}")

    failures = [k for k, v in results.items() if not v]
    if failures:
        print(f"\n{YELLOW}[!] Issues found: {', '.join(failures)}{NC}")
        print(f"\n{YELLOW}Recommended actions:{NC}")
        if "redis" in failures:
            print(f"  1. Check capture container: docker compose logs capture")
            print(f"  2. Restart capture: docker compose restart capture capture-lo")
        if "worker" in failures:
            print(f"  3. Restart worker: docker compose restart ml-worker")
    else:
        print(f"\n{GREEN}[+] All checks passed!{NC}")

if __name__ == "__main__":
    main()
