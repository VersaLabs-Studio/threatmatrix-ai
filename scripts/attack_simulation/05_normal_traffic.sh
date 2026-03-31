#!/usr/bin/env bash
# =============================================================================
# ThreatMatrix AI — Attack Simulation: Normal Traffic Baseline
# =============================================================================
#
# Scenario: Generate normal, legitimate traffic to the VPS API.
# Expected: NO alerts generated (false positive check).
#
# Usage:
#   ./05_normal_traffic.sh [TARGET_IP]
#
# If no argument given, defaults to 127.0.0.1.
# =============================================================================

set -euo pipefail

TARGET="${1:-127.0.0.1}"
API_URL="http://${TARGET}:8000/api/v1"
REQUESTS=30

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ThreatMatrix AI — Attack Simulation: Normal Traffic        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Record pre-traffic alert count
echo -e "${YELLOW}[*] Recording pre-traffic alert count...${NC}"
PRE_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
echo -e "    Pre-traffic alert count: ${PRE_COUNT}"
echo ""

echo -e "${YELLOW}[*] Generating ${REQUESTS} normal API requests...${NC}"
echo ""

ENDPOINTS=(
    "/system/health"
    "/flows/?limit=10"
    "/alerts/?limit=5"
    "/flows/stats"
    "/flows/protocols"
    "/flows/top-talkers?limit=5"
    "/ml/models"
    "/intel/feeds/status"
    "/capture/status"
)

SUCCESS=0
FAILED=0

for i in $(seq 1 ${REQUESTS}); do
    ENDPOINT="${ENDPOINTS[$((i % ${#ENDPOINTS[@]}))]}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${ENDPOINT}" 2>/dev/null || echo "000")

    if [ "${HTTP_CODE}" = "200" ]; then
        SUCCESS=$((SUCCESS + 1))
        echo -e "    [${i}/${REQUESTS}] GET ${ENDPOINT} — ${GREEN}${HTTP_CODE}${NC}"
    else
        FAILED=$((FAILED + 1))
        echo -e "    [${i}/${REQUESTS}] GET ${ENDPOINT} — ${RED}${HTTP_CODE}${NC}"
    fi

    # Normal human-like delay between requests
    sleep $(python3 -c "import random; print(round(random.uniform(0.5, 2.0), 2))")
done

echo ""
echo -e "${GREEN}[+] Traffic generation complete: ${SUCCESS} success, ${FAILED} failed${NC}"
echo -e "${YELLOW}[*] Waiting 30 seconds to verify no false-positive alerts...${NC}"
echo ""

sleep 30

CURRENT_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
NEW_ALERTS=$((CURRENT_COUNT - PRE_COUNT))

echo -e "    Pre-traffic alerts:  ${PRE_COUNT}"
echo -e "    Post-traffic alerts: ${CURRENT_COUNT}"
echo -e "    New alerts:          ${NEW_ALERTS}"
echo ""

if [ "${NEW_ALERTS}" -eq 0 ]; then
    echo -e "${GREEN}[✓] PASS — No false-positive alerts from normal traffic.${NC}"
else
    echo -e "${RED}[✗] FAIL — ${NEW_ALERTS} unexpected alert(s) from normal traffic!${NC}"
    echo -e "    This indicates a false-positive issue that should be investigated."
    echo ""
    echo -e "${CYAN}[*] False-positive alerts:${NC}"
    curl -s "${API_URL}/alerts/?limit=${NEW_ALERTS}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data if isinstance(data, list) else data.get('alerts', data.get('items', []))
for a in alerts[:${NEW_ALERTS}]:
    sev = a.get('severity','?').upper()
    cat = a.get('category','?')
    title = a.get('title','?')
    conf = a.get('confidence', 0)
    print(f'  [{sev}] {title}')
    print(f'    Category: {cat} | Confidence: {conf:.0%}')
    print()
" 2>/dev/null || echo "  (could not parse alerts)"
fi
