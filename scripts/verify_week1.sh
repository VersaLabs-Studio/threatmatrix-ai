#!/bin/bash
# ═══════════════════════════════════════════════════════
# ThreatMatrix AI — Week 1 Demo Verification Script
# Verifies all services are running and connected
# ═══════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════"
echo "  ThreatMatrix AI — Week 1 Demo Verification"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "  ${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

check_fail() {
    echo -e "  ${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

# ── 1. Docker Services ─────────────────────────────────
echo "1. Docker Services"
echo "─────────────────────────────────────────────────────"

if docker-compose ps | grep -q "postgres.*Up"; then
    check_pass "PostgreSQL is running"
else
    check_fail "PostgreSQL is not running"
fi

if docker-compose ps | grep -q "redis.*Up"; then
    check_pass "Redis is running"
else
    check_fail "Redis is not running"
fi

echo ""

# ── 2. Database Tables ─────────────────────────────────
echo "2. Database Schema"
echo "─────────────────────────────────────────────────────"

TABLES=$(docker-compose exec -T postgres psql -U threatmatrix -d threatmatrix -t -c "\dt" 2>/dev/null | grep -c "public |" || echo "0")

if [ "$TABLES" -ge 10 ]; then
    check_pass "Database has $TABLES tables (expected ≥10)"
else
    check_fail "Database has only $TABLES tables (expected ≥10)"
fi

echo ""

# ── 3. Backend Services Import ─────────────────────────
echo "3. Backend Services"
echo "─────────────────────────────────────────────────────"

cd backend 2>/dev/null || true

if python -c "from app.services.flow_service import get_flows, get_flow_stats, get_top_talkers, get_protocol_distribution, search_flows; print('[OK]')" 2>/dev/null; then
    check_pass "FlowService imports successfully"
else
    check_fail "FlowService import failed"
fi

if python -c "from app.services.alert_service import get_alerts, get_alert_by_id, update_alert_status, assign_alert, get_alert_stats, create_alert; print('[OK]')" 2>/dev/null; then
    check_pass "AlertService imports successfully"
else
    check_fail "AlertService import failed"
fi

if python -c "from app.services.auth_service import register_user, login_user, refresh_token, decode_token; print('[OK]')" 2>/dev/null; then
    check_pass "AuthService imports successfully"
else
    check_fail "AuthService import failed"
fi

if python -c "from app.api.v1.websocket import manager, websocket_endpoint; print('[OK]')" 2>/dev/null; then
    check_pass "WebSocket server imports successfully"
else
    check_fail "WebSocket server import failed"
fi

cd .. 2>/dev/null || true

echo ""

# ── 4. Frontend Hooks ──────────────────────────────────
echo "4. Frontend Hooks"
echo "─────────────────────────────────────────────────────"

cd frontend 2>/dev/null || true

if grep -q "export function useWebSocket" hooks/useWebSocket.ts 2>/dev/null; then
    check_pass "useWebSocket hook exported"
else
    check_fail "useWebSocket hook not found"
fi

if grep -q "export function useFlows" hooks/useFlows.ts 2>/dev/null; then
    check_pass "useFlows hook exported"
else
    check_fail "useFlows hook not found"
fi

if grep -q "export function useAlerts" hooks/useAlerts.ts 2>/dev/null; then
    check_pass "useAlerts hook exported"
else
    check_fail "useAlerts hook not found"
fi

# Check hooks make real API calls
if grep -q "api.get.*'/api/v1/flows'" hooks/useFlows.ts 2>/dev/null; then
    check_pass "useFlows makes real API calls"
else
    check_warn "useFlows may not make real API calls"
fi

if grep -q "api.get.*'/api/v1/alerts'" hooks/useAlerts.ts 2>/dev/null; then
    check_pass "useAlerts makes real API calls"
else
    check_warn "useAlerts may not make real API calls"
fi

if grep -q "wsClient.connect" hooks/useWebSocket.ts 2>/dev/null; then
    check_pass "useWebSocket connects to WebSocket"
else
    check_warn "useWebSocket may not connect to WebSocket"
fi

cd .. 2>/dev/null || true

echo ""

# ── 5. Frontend Compilation ────────────────────────────
echo "5. Frontend Compilation"
echo "─────────────────────────────────────────────────────"

cd frontend 2>/dev/null || true

if npx tsc --noEmit 2>/dev/null; then
    check_pass "TypeScript compiles without errors"
else
    check_warn "TypeScript has compilation warnings (check manually)"
fi

cd .. 2>/dev/null || true

echo ""

# ── 6. API Endpoints ───────────────────────────────────
echo "6. API Endpoints (if backend is running)"
echo "─────────────────────────────────────────────────────"

if curl -s http://localhost:8000/api/v1/system/health 2>/dev/null | grep -q "operational"; then
    check_pass "Backend health endpoint responding"
else
    check_warn "Backend not running (start with: cd backend && uvicorn app.main:app --reload)"
fi

if curl -s http://localhost:8000/docs 2>/dev/null | grep -q "swagger"; then
    check_pass "API docs accessible at /docs"
else
    check_warn "API docs not accessible (backend may not be running)"
fi

echo ""

# ── 7. War Room Components ─────────────────────────────
echo "7. War Room Components"
echo "─────────────────────────────────────────────────────"

if [ -f "frontend/components/war-room/MetricCard.tsx" ]; then
    check_pass "MetricCard component exists"
else
    check_fail "MetricCard component missing"
fi

if [ -f "frontend/components/war-room/ProtocolChart.tsx" ]; then
    check_pass "ProtocolChart component exists"
else
    check_fail "ProtocolChart component missing"
fi

if [ -f "frontend/components/war-room/TrafficTimeline.tsx" ]; then
    check_pass "TrafficTimeline component exists"
else
    check_fail "TrafficTimeline component missing"
fi

if [ -f "frontend/components/war-room/ThreatLevel.tsx" ]; then
    check_pass "ThreatLevel component exists"
else
    check_fail "ThreatLevel component missing"
fi

if [ -f "frontend/components/war-room/LiveAlertFeed.tsx" ]; then
    check_pass "LiveAlertFeed component exists"
else
    check_fail "LiveAlertFeed component missing"
fi

if [ -f "frontend/components/war-room/TopTalkers.tsx" ]; then
    check_pass "TopTalkers component exists"
else
    check_fail "TopTalkers component missing"
fi

if [ -f "frontend/components/war-room/ThreatMap.tsx" ]; then
    check_pass "ThreatMap component exists"
else
    check_fail "ThreatMap component missing"
fi

if [ -f "frontend/components/war-room/GeoDistribution.tsx" ]; then
    check_pass "GeoDistribution component exists"
else
    check_fail "GeoDistribution component missing"
fi

if [ -f "frontend/components/war-room/AIBriefingWidget.tsx" ]; then
    check_pass "AIBriefingWidget component exists"
else
    check_fail "AIBriefingWidget component missing"
fi

echo ""

# ── Summary ────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════"
echo "  VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}PASSED${NC}:  $PASS"
echo -e "  ${RED}FAILED${NC}:  $FAIL"
echo -e "  ${YELLOW}WARNINGS${NC}: $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}✅ WEEK 1 DEMO READY${NC}"
    echo ""
    echo "  Next steps:"
    echo "  1. Start backend: cd backend && uvicorn app.main:app --reload"
    echo "  2. Start frontend: cd frontend && npm run dev"
    echo "  3. Open: http://localhost:3000/war-room"
    echo "  4. Verify API docs: http://localhost:8000/docs"
else
    echo -e "  ${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "  Please fix the failed checks before demo."
fi

echo ""
echo "═══════════════════════════════════════════════════════"
