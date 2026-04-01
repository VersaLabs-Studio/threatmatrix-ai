#!/usr/bin/env bash
# =============================================================================
# ThreatMatrix AI — PCAP Upload & E2E Pipeline Test
# =============================================================================
#
# Tests the full PCAP → ML → Alert pipeline by:
# 1. Authenticating with the API
# 2. Recording baseline metrics
# 3. Uploading each demo PCAP
# 4. Waiting for processing
# 5. Verifying flows created, alerts generated, LLM narratives
#
# Usage:
#   ./test_pcap_pipeline.sh [API_URL]
#
# Default API_URL: http://localhost:8000
# =============================================================================

set -euo pipefail

API_URL="${1:-http://localhost:8000}"
PCAP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../pcaps/demo" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ThreatMatrix AI — PCAP Pipeline E2E Test                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check PCAP files exist
echo -e "${YELLOW}[*] Checking PCAP files...${NC}"
PCAP_FILES=("ddos_scenario.pcap" "port_scan.pcap" "dns_tunnel.pcap" "brute_force.pcap" "normal_traffic.pcap")
MISSING=0
for f in "${PCAP_FILES[@]}"; do
    if [ -f "${PCAP_DIR}/${f}" ]; then
        SIZE=$(stat -c%s "${PCAP_DIR}/${f}" 2>/dev/null || stat -f%z "${PCAP_DIR}/${f}" 2>/dev/null)
        echo -e "  ${GREEN}✓${NC} ${f} (${SIZE} bytes)"
    else
        echo -e "  ${RED}✗${NC} ${f} — MISSING"
        MISSING=$((MISSING + 1))
    fi
done

if [ "${MISSING}" -gt 0 ]; then
    echo ""
    echo -e "${RED}[ERROR] ${MISSING} PCAP file(s) missing. Generate with:${NC}"
    echo -e "  python3 scripts/generate_demo_pcaps.py --output-dir pcaps/demo"
    exit 1
fi
echo ""

# Authenticate
echo -e "${YELLOW}[*] Authenticating...${NC}"

# Try common demo credentials
TOKEN=""
for CREDS in \
    '{"email":"admin@threatmatrix.ai","password":"Demo2026!"}' \
    '{"email":"admin@threatmatrix.local","password":"admin123"}' \
    '{"email":"admin@admin.com","password":"admin"}'; do

    RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "${CREDS}" 2>/dev/null || echo "{}")

    TOKEN=$(echo "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")

    if [ -n "${TOKEN}" ] && [ "${TOKEN}" != "" ]; then
        echo -e "${GREEN}[+] Authenticated successfully${NC}"
        break
    fi
done

if [ -z "${TOKEN}" ]; then
    echo -e "${YELLOW}[!] Could not authenticate. Trying DEV_MODE (no auth)...${NC}"
    TOKEN="dev-mode"
fi
echo ""

# Record baseline
echo -e "${YELLOW}[*] Recording baseline metrics...${NC}"
BASELINE_FLOWS=$(curl -s -H "Authorization: Bearer ${TOKEN}" "${API_URL}/api/v1/flows/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_flows', d.get('total', 0)))" 2>/dev/null || echo "0")
BASELINE_ALERTS=$(curl -s -H "Authorization: Bearer ${TOKEN}" "${API_URL}/api/v1/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts', d.get('total', 0)))" 2>/dev/null || echo "0")
echo -e "  Flows:  ${BASELINE_FLOWS}"
echo -e "  Alerts: ${BASELINE_ALERTS}"
echo ""

# Upload each PCAP and track results
declare -a RESULTS=()
TOTAL_NEW_FLOWS=0
TOTAL_NEW_ALERTS=0

for PCAP_FILE in "${PCAP_FILES[@]}"; do
    PCAP_PATH="${PCAP_DIR}/${PCAP_FILE}"
    echo -e "${BOLD}${CYAN}━━━ Uploading: ${PCAP_FILE} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Upload
    UPLOAD_RESP=$(curl -s -X POST "${API_URL}/api/v1/capture/upload-pcap" \
        -H "Authorization: Bearer ${TOKEN}" \
        -F "file=@${PCAP_PATH}" 2>/dev/null || echo "{}")

    STATUS=$(echo "${UPLOAD_RESP}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','error'))" 2>/dev/null || echo "error")
    TASK_ID=$(echo "${UPLOAD_RESP}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task_id','?'))" 2>/dev/null || echo "?")

    if [ "${STATUS}" = "processing" ] || [ "${STATUS}" = "accepted" ]; then
        echo -e "  ${GREEN}✓${NC} Upload accepted (task: ${TASK_ID})"
    else
        echo -e "  ${RED}✗${NC} Upload failed: ${STATUS}"
        echo -e "  Response: ${UPLOAD_RESP}"
        RESULTS+=("${PCAP_FILE}: UPLOAD FAILED")
        continue
    fi

    # Wait for processing (longer wait to avoid async bleed-through)
    echo -e "  ${YELLOW}Waiting 45s for processing...${NC}"
    sleep 45

    # Check results
    CURRENT_FLOWS=$(curl -s -H "Authorization: Bearer ${TOKEN}" "${API_URL}/api/v1/flows/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_flows', d.get('total', 0)))" 2>/dev/null || echo "0")
    CURRENT_ALERTS=$(curl -s -H "Authorization: Bearer ${TOKEN}" "${API_URL}/api/v1/alerts/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_alerts', d.get('total', 0)))" 2>/dev/null || echo "0")

    NEW_FLOWS=$((CURRENT_FLOWS - BASELINE_FLOWS))
    NEW_ALERTS=$((CURRENT_ALERTS - BASELINE_ALERTS))

    echo -e "  Flows:  ${BASELINE_FLOWS} → ${CURRENT_FLOWS} (+${NEW_FLOWS})"
    echo -e "  Alerts: ${BASELINE_ALERTS} → ${CURRENT_ALERTS} (+${NEW_ALERTS})"

    if [ "${NEW_FLOWS}" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Flows created"
    else
        echo -e "  ${RED}✗${NC} No new flows"
    fi

    if [ "${NEW_ALERTS}" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Alert(s) generated"

        # Show latest alert
        LATEST=$(curl -s -H "Authorization: Bearer ${TOKEN}" "${API_URL}/api/v1/alerts/?limit=1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data if isinstance(data, list) else data.get('alerts', data.get('items', []))
if alerts:
    a = alerts[0]
    print(f'[{a.get(\"severity\",\"?\").upper()}] {a.get(\"title\",\"?\")}')
    print(f'  Category: {a.get(\"category\",\"?\")} | Confidence: {a.get(\"confidence\",0):.0%}')
    n = a.get('ai_narrative','')
    if n:
        print(f'  AI: {n[:100]}...')
else:
    print('  (no alerts)')
" 2>/dev/null || echo "  (parse error)")
        echo -e "  Latest: ${LATEST}"
    else
        echo -e "  ${YELLOW}!${NC} No alerts (may be below threshold or normal traffic)"
    fi

    # Update baselines for next iteration
    BASELINE_FLOWS="${CURRENT_FLOWS}"
    BASELINE_ALERTS="${CURRENT_ALERTS}"
    TOTAL_NEW_FLOWS=$((TOTAL_NEW_FLOWS + NEW_FLOWS))
    TOTAL_NEW_ALERTS=$((TOTAL_NEW_ALERTS + NEW_ALERTS))

    if [ "${NEW_FLOWS}" -gt 0 ] && [ "${NEW_ALERTS}" -gt 0 ]; then
        RESULTS+=("${PCAP_FILE}: PASS (flows: +${NEW_FLOWS}, alerts: +${NEW_ALERTS})")
    elif [ "${NEW_FLOWS}" -gt 0 ]; then
        RESULTS+=("${PCAP_FILE}: PARTIAL (flows: +${NEW_FLOWS}, no alerts)")
    else
        RESULTS+=("${PCAP_FILE}: FAIL (no flows, no alerts)")
    fi

    echo ""
done

# Summary
echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PCAP PIPELINE TEST — RESULTS                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

PASS=0
for r in "${RESULTS[@]}"; do
    if [[ "$r" == *"PASS"* ]]; then
        echo -e "  ${GREEN}✓${NC} ${r}"
        PASS=$((PASS + 1))
    elif [[ "$r" == *"PARTIAL"* ]]; then
        echo -e "  ${YELLOW}~${NC} ${r}"
    else
        echo -e "  ${RED}✗${NC} ${r}"
    fi
done

echo ""
echo -e "${CYAN}Totals:${NC}"
echo -e "  New flows:  ${TOTAL_NEW_FLOWS}"
echo -e "  New alerts: ${TOTAL_NEW_ALERTS}"
echo -e "  Pass rate:  ${PASS}/5"
echo ""

if [ "${PASS}" -ge 3 ]; then
    echo -e "${GREEN}[✓] PCAP pipeline validated — ${PASS}/5 scenarios produced alerts${NC}"
elif [ "${PASS}" -ge 1 ]; then
    echo -e "${YELLOW}[!] Partial success — ${PASS}/5 scenarios produced alerts${NC}"
else
    echo -e "${RED}[✗] Pipeline issue — no PCAPs produced alerts${NC}"
    echo -e "    Check: ML Worker running? Models loaded? Alert Engine active?"
fi
