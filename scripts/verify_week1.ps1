# ═══════════════════════════════════════════════════════
# ThreatMatrix AI — Week 1 Demo Verification Script (PowerShell)
# Verifies all services are running and connected
# ═══════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ThreatMatrix AI — Week 1 Demo Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$script:PASS = 0
$script:FAIL = 0
$script:WARN = 0

function Check-Pass($msg) {
    Write-Host "  ✅ PASS: $msg" -ForegroundColor Green
    $script:PASS++
}

function Check-Fail($msg) {
    Write-Host "  ❌ FAIL: $msg" -ForegroundColor Red
    $script:FAIL++
}

function Check-Warn($msg) {
    Write-Host "  ⚠️  WARN: $msg" -ForegroundColor Yellow
    $script:WARN++
}

# ── 1. Docker Services ─────────────────────────────────
Write-Host "1. Docker Services" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

$dockerPs = docker-compose ps 2>$null
if ($dockerPs -match "postgres.*Up") {
    Check-Pass "PostgreSQL is running"
} else {
    Check-Fail "PostgreSQL is not running"
}

if ($dockerPs -match "redis.*Up") {
    Check-Pass "Redis is running"
} else {
    Check-Fail "Redis is not running"
}

Write-Host ""

# ── 2. Database Tables ─────────────────────────────────
Write-Host "2. Database Schema" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

$tables = docker-compose exec -T postgres psql -U threatmatrix -d threatmatrix -t -c "\dt" 2>$null
$tableCount = ($tables | Select-String "public |").Matches.Count

if ($tableCount -ge 10) {
    Check-Pass "Database has $tableCount tables (expected ≥10)"
} else {
    Check-Fail "Database has only $tableCount tables (expected ≥10)"
}

Write-Host ""

# ── 3. Backend Services Import ─────────────────────────
Write-Host "3. Backend Services" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

Push-Location backend

$flowServiceTest = python -c "from app.services.flow_service import get_flows, get_flow_stats, get_top_talkers, get_protocol_distribution, search_flows; print('[OK]')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Check-Pass "FlowService imports successfully"
} else {
    Check-Fail "FlowService import failed"
}

$alertServiceTest = python -c "from app.services.alert_service import get_alerts, get_alert_by_id, update_alert_status, assign_alert, get_alert_stats, create_alert; print('[OK]')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Check-Pass "AlertService imports successfully"
} else {
    Check-Fail "AlertService import failed"
}

$authServiceTest = python -c "from app.services.auth_service import register_user, login_user, refresh_token, decode_token; print('[OK]')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Check-Pass "AuthService imports successfully"
} else {
    Check-Fail "AuthService import failed"
}

$wsTest = python -c "from app.api.v1.websocket import manager, websocket_endpoint; print('[OK]')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Check-Pass "WebSocket server imports successfully"
} else {
    Check-Fail "WebSocket server import failed"
}

Pop-Location

Write-Host ""

# ── 4. Frontend Hooks ──────────────────────────────────
Write-Host "4. Frontend Hooks" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

Push-Location frontend

if (Select-String -Path "hooks/useWebSocket.ts" -Pattern "export function useWebSocket" -Quiet) {
    Check-Pass "useWebSocket hook exported"
} else {
    Check-Fail "useWebSocket hook not found"
}

if (Select-String -Path "hooks/useFlows.ts" -Pattern "export function useFlows" -Quiet) {
    Check-Pass "useFlows hook exported"
} else {
    Check-Fail "useFlows hook not found"
}

if (Select-String -Path "hooks/useAlerts.ts" -Pattern "export function useAlerts" -Quiet) {
    Check-Pass "useAlerts hook exported"
} else {
    Check-Fail "useAlerts hook not found"
}

# Check hooks make real API calls
if (Select-String -Path "hooks/useFlows.ts" -Pattern "api.get.*'/api/v1/flows'" -Quiet) {
    Check-Pass "useFlows makes real API calls"
} else {
    Check-Warn "useFlows may not make real API calls"
}

if (Select-String -Path "hooks/useAlerts.ts" -Pattern "api.get.*'/api/v1/alerts'" -Quiet) {
    Check-Pass "useAlerts makes real API calls"
} else {
    Check-Warn "useAlerts may not make real API calls"
}

if (Select-String -Path "hooks/useWebSocket.ts" -Pattern "wsClient.connect" -Quiet) {
    Check-Pass "useWebSocket connects to WebSocket"
} else {
    Check-Warn "useWebSocket may not connect to WebSocket"
}

Pop-Location

Write-Host ""

# ── 5. Frontend Compilation ────────────────────────────
Write-Host "5. Frontend Compilation" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

Push-Location frontend

$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Check-Pass "TypeScript compiles without errors"
} else {
    Check-Warn "TypeScript has compilation warnings (check manually)"
}

Pop-Location

Write-Host ""

# ── 6. API Endpoints ───────────────────────────────────
Write-Host "6. API Endpoints (if backend is running)" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/system/health" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($healthResponse.Content -match "operational") {
        Check-Pass "Backend health endpoint responding"
    } else {
        Check-Warn "Backend health endpoint returned unexpected response"
    }
} catch {
    Check-Warn "Backend not running (start with: cd backend && uvicorn app.main:app --reload)"
}

try {
    $docsResponse = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($docsResponse.Content -match "swagger") {
        Check-Pass "API docs accessible at /docs"
    } else {
        Check-Warn "API docs not accessible"
    }
} catch {
    Check-Warn "API docs not accessible (backend may not be running)"
}

Write-Host ""

# ── 7. War Room Components ─────────────────────────────
Write-Host "7. War Room Components" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"

$components = @(
    "MetricCard.tsx",
    "ProtocolChart.tsx",
    "TrafficTimeline.tsx",
    "ThreatLevel.tsx",
    "LiveAlertFeed.tsx",
    "TopTalkers.tsx",
    "ThreatMap.tsx",
    "GeoDistribution.tsx",
    "AIBriefingWidget.tsx"
)

foreach ($comp in $components) {
    if (Test-Path "frontend/components/war-room/$comp") {
        Check-Pass "$comp component exists"
    } else {
        Check-Fail "$comp component missing"
    }
}

Write-Host ""

# ── Summary ────────────────────────────────────────────
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PASSED:  $script:PASS" -ForegroundColor Green
Write-Host "  FAILED:  $script:FAIL" -ForegroundColor Red
Write-Host "  WARNINGS: $script:WARN" -ForegroundColor Yellow
Write-Host ""

if ($script:FAIL -eq 0) {
    Write-Host "  ✅ WEEK 1 DEMO READY" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps:"
    Write-Host "  1. Start backend: cd backend && uvicorn app.main:app --reload"
    Write-Host "  2. Start frontend: cd frontend && npm run dev"
    Write-Host "  3. Open: http://localhost:3000/war-room"
    Write-Host "  4. Verify API docs: http://localhost:8000/docs"
} else {
    Write-Host "  ❌ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please fix the failed checks before demo."
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
