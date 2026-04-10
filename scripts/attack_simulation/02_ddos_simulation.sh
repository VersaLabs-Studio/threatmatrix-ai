#!/usr/bin/env bash
# =============================================================================
# ThreatMatrix AI — Attack Simulation: DDoS SYN Flood
# =============================================================================
#
# Scenario: High-volume SYN flood against port 80 on the VPS.
# Expected: Isolation Forest detects volume anomaly, ensemble scores CRITICAL.
# Alert Severity: CRITICAL (composite >= 0.90)
#
# Usage:
#   ./02_ddos_simulation.sh [TARGET_IP]
#
# If no argument given, defaults to 127.0.0.1.
# Requires: hping3 (apt install hping3)
#
# WARNING: This generates high packet rates. Only run against systems you own.
# The script limits the flood to 10 seconds to avoid disruption.
# =============================================================================

set -euo pipefail

TARGET="${1:-127.0.0.1}"
DURATION=10
API_URL="${2:-http://localhost:8000/api/v1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  ThreatMatrix AI — Attack Simulation: DDoS SYN Flood        ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check hping3 is installed
if ! command -v hping3 &> /dev/null; then
    echo -e "${RED}[ERROR] hping3 not found. Install with: apt install hping3${NC}"
    exit 1
fi

# Record pre-attack alert count
echo -e "${YELLOW}[*] Recording pre-attack alert count...${NC}"
PRE_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
echo -e "    Pre-attack alert count: ${PRE_COUNT}"
echo ""

# Run SYN flood for limited duration
echo -e "${RED}[!] Launching SYN flood against ${TARGET}:80 for ${DURATION} seconds...${NC}"
echo -e "    Command: timeout ${DURATION} hping3 -S --flood -p 80 ${TARGET}"
echo -e "    ${YELLOW}This will generate thousands of SYN packets per second.${NC}"
echo ""

timeout "${DURATION}" hping3 -S --flood -p 80 "${TARGET}" 2>&1 || true

echo ""
echo -e "${GREEN}[+] Flood complete (${DURATION}s). Waiting 45 seconds for ML scoring + alert creation...${NC}"
echo ""

# Poll for new alerts (DDoS may take longer to process due to flow aggregation)
for i in $(seq 1 9); do
    sleep 5
    CURRENT_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
    NEW_ALERTS=$((CURRENT_COUNT - PRE_COUNT))
    echo -e "    [${i}/9] Current alerts: ${CURRENT_COUNT} (+${NEW_ALERTS} new)"

    if [ "${NEW_ALERTS}" -gt 0 ]; then
        echo ""
        echo -e "${GREEN}[+] ALERT(S) DETECTED! ${NEW_ALERTS} new alert(s) generated.${NC}"
        echo ""

        # Fetch latest alerts with severity focus
        echo -e "${CYAN}[*] Latest alerts:${NC}"
        curl -s "${API_URL}/alerts/?limit=5" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data if isinstance(data, list) else data.get('alerts', data.get('items', []))
for a in alerts[:5]:
    sev = a.get('severity','?').upper()
    cat = a.get('category','?')
    title = a.get('title','?')
    conf = a.get('confidence', 0)
    score = a.get('composite_score', 0)
    print(f'  [{sev}] {title}')
    print(f'    Category: {cat} | Confidence: {conf:.0%} | Score: {score:.3f}')
    print(f'    ID: {a.get(\"alert_id\",\"?\")}')
    narrative = a.get('ai_narrative','')
    if narrative:
        print(f'    AI Narrative: {narrative[:120]}...')
    print()
" 2>/dev/null || echo "  (could not parse alerts)"

        # Check if any are CRITICAL
        CRITICAL=$(curl -s "${API_URL}/alerts/?limit=5&severity=critical" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data if isinstance(data, list) else data.get('alerts', data.get('items', []))
print(len(alerts))
" 2>/dev/null || echo "0")

        if [ "${CRITICAL}" -gt 0 ]; then
            echo -e "${RED}[!!!] CRITICAL alert confirmed — DDoS detection successful!${NC}"
        else
            echo -e "${YELLOW}[!] No CRITICAL alerts yet — may still be processing.${NC}"
        fi
        exit 0
    fi
done

echo -e "${YELLOW}[!] No new alerts detected after 45 seconds.${NC}"
echo -e "    Possible reasons:"
echo -e "    - Flow aggregation timeout (30-120s) not elapsed"
echo -e "    - Capture engine not on the right interface"
echo -e "    - Try: Check ${API_URL}/capture/status and ${API_URL}/flows/stats"
