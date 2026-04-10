#!/usr/bin/env bash
# =============================================================================
# ThreatMatrix AI — Attack Simulation: Port Scan Detection
# =============================================================================
#
# Scenario: SYN port sweep targeting common ports on the VPS.
# Expected: Random Forest classifies as "probe" / port_scan.
# Alert Severity: HIGH (confidence >= 0.75)
#
# Usage:
#   ./01_port_scan.sh [TARGET_IP]
#
# If no argument given, defaults to the VPS public IP.
# Requires: nmap (apt install nmap)
# =============================================================================

set -euo pipefail

TARGET="${1:-127.0.0.1}"
API_URL="${2:-http://localhost:8000/api/v1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ThreatMatrix AI — Attack Simulation: Port Scan             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check nmap is installed
if ! command -v nmap &> /dev/null; then
    echo -e "${RED}[ERROR] nmap not found. Install with: apt install nmap${NC}"
    exit 1
fi

# Record pre-attack alert count
echo -e "${YELLOW}[*] Recording pre-attack alert count...${NC}"
PRE_COUNT=$(curl -s "${API_URL}/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts',0))" 2>/dev/null || echo "0")
echo -e "    Pre-attack alert count: ${PRE_COUNT}"
echo ""

# Run SYN scan on common ports
echo -e "${YELLOW}[*] Launching SYN scan against ${TARGET} (ports 1-1024)...${NC}"
echo -e "    Command: nmap -sS -p 1-1024 ${TARGET} --max-retries 1 -T4"
echo ""

nmap -sS -p 1-1024 "${TARGET}" --max-retries 1 -T4 2>&1 || true

echo ""
echo -e "${GREEN}[+] Scan complete. Waiting 30 seconds for ML scoring + alert creation...${NC}"
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

        # Fetch latest alerts
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
echo -e "    This may indicate:"
echo -e "    - Capture engine not monitoring the target interface"
echo -e "    - ML Worker not running"
echo -e "    - Traffic didn't meet anomaly threshold"
echo ""
echo -e "    Try: Check capture status at ${API_URL}/capture/status"
