#!/usr/bin/env bash
# =============================================================================
# ThreatMatrix AI — Attack Simulation: SSH Brute Force
# =============================================================================
#
# Scenario: Rapid SSH connection attempts simulating brute force attack.
# Uses a simple bash loop with sshpass for portability (no hydra dependency).
# Falls back to raw TCP connections via nc/bash if sshpass unavailable.
#
# Expected: Random Forest classifies as R2L / unauthorized_access.
# Alert Severity: HIGH
#
# Usage:
#   ./04_brute_force.sh [TARGET_IP]
#
# If no argument given, defaults to 127.0.0.1.
# =============================================================================

set -euo pipefail

TARGET="${1:-127.0.0.1}"
SSH_PORT=22
ATTEMPTS=30
API_URL="${2:-http://localhost:8000/api/v1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ThreatMatrix AI — Attack Simulation: SSH Brute Force       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Record pre-attack alert count
echo -e "${YELLOW}[*] Recording pre-attack alert count...${NC}"
PRE_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
echo -e "    Pre-attack alert count: ${PRE_COUNT}"
echo ""

# Determine attack method
USE_SSHPASS=false
USE_HYDRA=false

if command -v hydra &> /dev/null; then
    USE_HYDRA=true
    echo -e "${GREEN}[+] hydra found — using hydra for brute force simulation${NC}"
elif command -v sshpass &> /dev/null; then
    USE_SSHPASS=true
    echo -e "${GREEN}[+] sshpass found — using sshpass for brute force simulation${NC}"
else
    echo -e "${YELLOW}[*] Neither hydra nor sshpass found — using raw TCP connections${NC}"
fi
echo ""

# Method 1: Hydra
if [ "$USE_HYDRA" = true ]; then
    echo -e "${YELLOW}[*] Launching SSH brute force with hydra (${ATTEMPTS} attempts)...${NC}"

    # Create a small wordlist for demo purposes
    WORDLIST=$(mktemp)
    for i in $(seq 1 ${ATTEMPTS}); do
        echo "password${i}" >> "${WORDLIST}"
        echo "admin${i}" >> "${WORDLIST}"
        echo "test${i}" >> "${WORDLIST}"
    done
    echo "root" >> "${WORDLIST}"
    echo "admin" >> "${WORDLIST}"
    echo "password" >> "${WORDLIST}"
    echo "123456" >> "${WORDLIST}"

    hydra -l root -P "${WORDLIST}" "ssh://${TARGET}:${SSH_PORT}" -t 4 -vV -I 2>&1 || true
    rm -f "${WORDLIST}"

# Method 2: sshpass loop
elif [ "$USE_SSHPASS" = true ]; then
    echo -e "${YELLOW}[*] Launching SSH brute force with sshpass (${ATTEMPTS} attempts)...${NC}"

    PASSWORDS=("root" "admin" "password" "123456" "test" "letmein" "welcome" "monkey" "dragon" "master")

    for i in $(seq 1 ${ATTEMPTS}); do
        PASS="${PASSWORDS[$((i % ${#PASSWORDS[@]}))]}"
        echo -e "    Attempt ${i}/${ATTEMPTS}: root:${PASS}"
        # Timeout 2s per attempt to avoid hanging
        timeout 2 sshpass -p "${PASS}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=2 root@"${TARGET}" "exit" 2>&1 || true
        sleep 0.1
    done

# Method 3: Raw TCP connections (simulates connection flood to port 22)
else
    echo -e "${YELLOW}[*] Launching raw TCP connection flood to ${TARGET}:${SSH_PORT} (${ATTEMPTS} attempts)...${NC}"
    echo -e "    This simulates rapid connection attempts that the capture engine will see."
    echo ""

    for i in $(seq 1 ${ATTEMPTS}); do
        echo -e "    Connection ${i}/${ATTEMPTS}..."
        # Use bash TCP redirection to simulate connection attempts
        timeout 1 bash -c "echo '' > /dev/tcp/${TARGET}/${SSH_PORT}" 2>/dev/null || true
        sleep 0.05
    done
fi

echo ""
echo -e "${GREEN}[+] Brute force simulation complete. Waiting 30 seconds for ML scoring...${NC}"
echo ""

# Poll for new alerts
for i in $(seq 1 6); do
    sleep 5
    CURRENT_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
    NEW_ALERTS=$((CURRENT_COUNT - PRE_COUNT))
    echo -e "    [${i}/6] Current alerts: ${CURRENT_COUNT} (+${NEW_ALERTS} new)"

    if [ "${NEW_ALERTS}" -gt 0 ]; then
        echo ""
        echo -e "${GREEN}[+] ALERT DETECTED! ${NEW_ALERTS} new alert(s) generated.${NC}"
        echo ""

        echo -e "${CYAN}[*] Latest alerts:${NC}"
        curl -s "${API_URL}/alerts/?limit=3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data if isinstance(data, list) else data.get('alerts', data.get('items', []))
for a in alerts[:3]:
    sev = a.get('severity','?').upper()
    cat = a.get('category','?')
    title = a.get('title','?')
    conf = a.get('confidence', 0)
    print(f'  [{sev}] {title}')
    print(f'    Category: {cat} | Confidence: {conf:.0%}')
    print(f'    ID: {a.get(\"alert_id\",\"?\")}')
    narrative = a.get('ai_narrative','')
    if narrative:
        print(f'    AI Narrative: {narrative[:120]}...')
    print()
" 2>/dev/null || echo "  (could not parse alerts)"
        exit 0
    fi
done

echo -e "${YELLOW}[!] No new alerts detected after 30 seconds.${NC}"
echo -e "    SSH brute force may need more attempts or longer flow timeout."
echo -e "    Check: curl ${API_URL}/flows/?dst_port=22"
