#!/usr/bin/env bash
# =============================================================================
# ThreatMatrix AI — Attack Simulation: Run All Scenarios
# =============================================================================
#
# Master script that executes all attack scenarios sequentially with
# cooldown periods between each. Provides a full demo walkthrough.
#
# Usage:
#   ./run_all.sh [TARGET_IP]
#
# If no argument given, defaults to 127.0.0.1.
#
# This script must be run from the scripts/attack_simulation/ directory.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-127.0.0.1}"
COOLDOWN=30  # Seconds between scenarios

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ThreatMatrix AI — Full Attack Simulation Suite             ║"
echo "║  Target: ${TARGET}                                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}[*] Checking prerequisites...${NC}"
MISSING=()

command -v nmap &> /dev/null || MISSING+=("nmap (apt install nmap)")
command -v hping3 &> /dev/null || MISSING+=("hping3 (apt install hping3)")
command -v python3 &> /dev/null || MISSING+=("python3")
command -v curl &> /dev/null || MISSING+=("curl")

if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${RED}[ERROR] Missing prerequisites:${NC}"
    for m in "${MISSING[@]}"; do
        echo -e "  - ${m}"
    done
    echo ""
    echo -e "Install with: apt install nmap hping3 python3 curl"
    exit 1
fi

echo -e "${GREEN}[+] All prerequisites met.${NC}"
echo ""

# Verify API is reachable
echo -e "${YELLOW}[*] Verifying ThreatMatrix API is reachable...${NC}"
if ! curl -s --connect-timeout 5 http://localhost:8000/api/v1/system/health > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Cannot reach ThreatMatrix API at http://localhost:8000${NC}"
    echo -e "    Ensure Docker containers are running: docker-compose ps"
    exit 1
fi
echo -e "${GREEN}[+] API is reachable.${NC}"
echo ""

# Record initial state
INITIAL_ALERTS=$(curl -s http://localhost:8000/api/v1/alerts/stats | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
INITIAL_FLOWS=$(curl -s http://localhost:8000/api/v1/flows/stats | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_flows',0))" 2>/dev/null || echo "0")

echo -e "${CYAN}[*] Initial state:${NC}"
echo -e "    Total alerts: ${INITIAL_ALERTS}"
echo -e "    Total flows:  ${INITIAL_FLOWS}"
echo ""

# Results tracking
declare -a RESULTS=()
START_TIME=$(date +%s)

# =============================================================================
# Scenario 1: Port Scan
# =============================================================================
echo -e "${BOLD}${CYAN}━━━ Scenario 1/5: Port Scan ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if bash "${SCRIPT_DIR}/01_port_scan.sh" "${TARGET}"; then
    RESULTS+=("Port Scan: PASS")
else
    RESULTS+=("Port Scan: INCONCLUSIVE")
fi
echo ""
echo -e "${YELLOW}[*] Cooling down (${COOLDOWN}s)...${NC}"
sleep "${COOLDOWN}"
echo ""

# =============================================================================
# Scenario 2: DDoS Simulation
# =============================================================================
echo -e "${BOLD}${RED}━━━ Scenario 2/5: DDoS SYN Flood ━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if bash "${SCRIPT_DIR}/02_ddos_simulation.sh" "${TARGET}"; then
    RESULTS+=("DDoS Flood: PASS")
else
    RESULTS+=("DDoS Flood: INCONCLUSIVE")
fi
echo ""
echo -e "${YELLOW}[*] Cooling down (${COOLDOWN}s)...${NC}"
sleep "${COOLDOWN}"
echo ""

# =============================================================================
# Scenario 3: DNS Tunneling
# =============================================================================
echo -e "${BOLD}${YELLOW}━━━ Scenario 3/5: DNS Tunneling ━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if python3 "${SCRIPT_DIR}/03_dns_tunnel.py" "${TARGET}"; then
    RESULTS+=("DNS Tunneling: PASS")
else
    RESULTS+=("DNS Tunneling: INCONCLUSIVE")
fi
echo ""
echo -e "${YELLOW}[*] Cooling down (${COOLDOWN}s)...${NC}"
sleep "${COOLDOWN}"
echo ""

# =============================================================================
# Scenario 4: SSH Brute Force
# =============================================================================
echo -e "${BOLD}${CYAN}━━━ Scenario 4/5: SSH Brute Force ━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if bash "${SCRIPT_DIR}/04_brute_force.sh" "${TARGET}"; then
    RESULTS+=("SSH Brute Force: PASS")
else
    RESULTS+=("SSH Brute Force: INCONCLUSIVE")
fi
echo ""
echo -e "${YELLOW}[*] Cooling down (${COOLDOWN}s)...${NC}"
sleep "${COOLDOWN}"
echo ""

# =============================================================================
# Scenario 5: Normal Traffic (False Positive Check)
# =============================================================================
echo -e "${BOLD}${GREEN}━━━ Scenario 5/5: Normal Traffic (False Positive Check) ━━━━${NC}"
if bash "${SCRIPT_DIR}/05_normal_traffic.sh" "${TARGET}"; then
    RESULTS+=("Normal Traffic: PASS (no false positives)")
else
    RESULTS+=("Normal Traffic: FALSE POSITIVES DETECTED")
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
FINAL_ALERTS=$(curl -s http://localhost:8000/api/v1/alerts/stats | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
FINAL_FLOWS=$(curl -s http://localhost:8000/api/v1/flows/stats | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_flows',0))" 2>/dev/null || echo "0")
TOTAL_NEW_ALERTS=$((FINAL_ALERTS - INITIAL_ALERTS))
TOTAL_NEW_FLOWS=$((FINAL_FLOWS - INITIAL_FLOWS))

echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  SIMULATION COMPLETE — RESULTS SUMMARY                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

for r in "${RESULTS[@]}"; do
    if [[ "$r" == *"PASS"* ]]; then
        echo -e "  ${GREEN}✓${NC} ${r}"
    elif [[ "$r" == *"FALSE POSITIVES"* ]]; then
        echo -e "  ${RED}✗${NC} ${r}"
    else
        echo -e "  ${YELLOW}?${NC} ${r}"
    fi
done

echo ""
echo -e "${CYAN}Statistics:${NC}"
echo -e "  Duration:       ${ELAPSED}s"
echo -e "  Alerts before:  ${INITIAL_ALERTS}"
echo -e "  Alerts after:   ${FINAL_ALERTS}"
echo -e "  New alerts:     ${TOTAL_NEW_ALERTS}"
echo -e "  Flows before:   ${INITIAL_FLOWS}"
echo -e "  Flows after:    ${FINAL_FLOWS}"
echo -e "  New flows:      ${TOTAL_NEW_FLOWS}"
echo ""

# Count pass/fail
PASS_COUNT=$(printf '%s\n' "${RESULTS[@]}" | grep -c "PASS" || true)
echo -e "${BOLD}Result: ${PASS_COUNT}/5 scenarios detected successfully${NC}"
echo ""

if [ "${TOTAL_NEW_ALERTS}" -gt 0 ]; then
    echo -e "${GREEN}[+] View alerts in the frontend: http://localhost:3000/alerts${NC}"
    echo -e "${GREEN}[+] View in War Room: http://localhost:3000/war-room${NC}"
fi
