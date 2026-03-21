# ThreatMatrix AI — Visual Confirmation Checklist

> **Date:** 2026-03-21  
> **Purpose:** Verify mock data displays correctly on the War Room frontend  
> **Prerequisites:** Docker running, seed script executed, backend + frontend running

---

## Pre-Flight Check

- [ ] Docker containers running: `docker-compose ps`
- [ ] PostgreSQL accessible on port 5432
- [ ] Redis accessible on port 6379
- [ ] Backend running: `http://localhost:8000/docs` (Swagger loads)
- [ ] Frontend running: `http://localhost:3000` (Page loads)
- [ ] Seed data loaded: 500 flows, 25 alerts in database

---

## War Room Dashboard — Row 1: Metric Cards

| # | Component | Expected Visual | Data Source | Verified |
|---|-----------|-----------------|-------------|----------|
| 1 | **PACKETS/SEC** | Numeric value with "pkt/s" unit, cyan accent | `/api/v1/flows/stats` | [ ] |
| 2 | **ACTIVE FLOWS** | Numeric value with "flows" unit, cyan accent | `/api/v1/flows/stats` | [ ] |
| 3 | **ANOMALY RATE** | Percentage value (>0%), warning/critical accent if >5% | Calculated from stats | [ ] |
| 4 | **THREATS (24H)** | Alert count (>0), critical accent | `/api/v1/alerts/stats` | [ ] |

**Visual Check:**
- [ ] All 4 cards render without errors
- [ ] Numbers update every 3-5 seconds (auto-refresh)
- [ ] No "Loading..." text visible
- [ ] Colors match severity (cyan for normal, warning/critical for anomalies)

---

## War Room Dashboard — Row 2: Threat Map + Side Panels

### Left Panel: Live Threat Map

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Map renders | Dark Maplibre basemap visible | [ ] |
| 2 | Title | "LIVE THREAT MAP" with green dot | [ ] |
| 3 | ScatterplotLayer | Cyan dots (normal) and red dots (anomaly) | [ ] |
| 4 | ArcLayer | Glowing arcs between source/destination IPs | [ ] |
| 5 | WebGL context | No console errors about WebGL | [ ] |

**Visual Check:**
- [ ] Map loads without WebGL errors
- [ ] At least 5-10 dots visible on the map
- [ ] Anomalous flows shown in red, normal in cyan
- [ ] Map is interactive (can pan/zoom)

### Right Panel: Protocol Distribution

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Donut chart | Animated pie chart with protocol segments | [ ] |
| 2 | Protocol labels | TCP, UDP, ICMP labels with percentages | [ ] |
| 3 | Data accuracy | Percentages sum to ~100% | [ ] |

**Visual Check:**
- [ ] Chart renders without errors
- [ ] At least 2 protocol segments visible (TCP, UDP)
- [ ] Percentages are realistic (TCP should dominate)

### Right Panel: Traffic Timeline

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Area chart | Glowing cyan area chart | [ ] |
| 2 | Time axis | X-axis shows time labels | [ ] |
| 3 | Data points | Visible data points on the chart | [ ] |
| 4 | Anomaly overlay | Red spikes if anomalies exist | [ ] |

**Visual Check:**
- [ ] Chart renders with visible data
- [ ] Chart updates every 5 seconds
- [ ] Time labels are readable

### Right Panel: Threat Level Gauge

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Gauge widget | Circular/radial gauge visible | [ ] |
| 2 | Level indicator | Shows ELEVATED/HIGH/CRITICAL based on alerts | [ ] |
| 3 | Color coding | Green (SAFE) → Yellow (ELEVATED) → Red (CRITICAL) | [ ] |

**Visual Check:**
- [ ] Gauge renders
- [ ] Level matches actual alert severity distribution
- [ ] Color matches the level

---

## War Room Dashboard — Row 3: AI Briefing

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Widget visible | Glassmorphism panel with "AI BRIEFING" header | [ ] |
| 2 | Content | Narrative text about network status | [ ] |
| 3 | Link | "View Full Briefing →" button | [ ] |

**Visual Check:**
- [ ] Widget renders without errors
- [ ] Contains text (even if placeholder)
- [ ] Styling matches dark theme

---

## War Room Dashboard — Row 4: Alert Feed + Top Talkers + Geo

### Left: Live Alert Feed

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Alert list | Scrolling list of alert cards | [ ] |
| 2 | Severity indicators | Colored dots (🔴 Critical, 🟡 High, etc.) | [ ] |
| 3 | Timestamps | Time format HH:MM:SS | [ ] |
| 4 | Categories | Attack type labels (DDoS, Port Scan, etc.) | [ ] |

**Visual Check:**
- [ ] At least 5 alerts visible
- [ ] Different severity levels present
- [ ] Timestamps are in the last hour
- [ ] Cards have proper styling (glassmorphism)

### Middle: Top Talkers

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | IP list | Horizontal bar chart or ranked list | [ ] |
| 2 | IP addresses | Valid IP format (e.g., 10.0.1.5) | [ ] |
| 3 | Traffic volumes | Byte counts displayed | [ ] |

**Visual Check:**
- [ ] At least 3 IPs listed
- [ ] IPs are from the INTERNAL_IPS list
- [ ] Bars/values are proportional

### Right: Geo Distribution

| # | Element | Expected Visual | Verified |
|---|---------|-----------------|----------|
| 1 | Country list | Flag icons with country codes | [ ] |
| 2 | Percentages | Traffic percentage per country | [ ] |
| 3 | Data accuracy | Percentages sum to ~100% | [ ] |

**Visual Check:**
- [ ] At least 3 countries listed
- [ ] Ethiopia (ET) appears in the list
- [ ] Flags render correctly

---

## Live WebSocket Events

| # | Test | Expected Behavior | Verified |
|---|------|-------------------|----------|
| 1 | Browser console | `[ThreatMatrix WS] Connected` message | [ ] |
| 2 | Connection status | Green indicator in TopBar or StatusBar | [ ] |
| 3 | Event reception | `new_flow` events received every few seconds | [ ] |
| 4 | Event reception | `new_alert` events received | [ ] |

**Visual Check:**
- [ ] Open browser DevTools → Console
- [ ] Look for WebSocket connection messages
- [ ] Verify events are being received

---

## API Endpoints Verification

Run these commands to verify data is accessible via API:

```bash
# Health check
curl http://localhost:8000/api/v1/system/health

# Get flows (should return items)
curl http://localhost:8000/api/v1/flows/?limit=5

# Get flow stats (should show totals)
curl http://localhost:8000/api/v1/flows/stats?interval=1h

# Get alerts (should return items)
curl http://localhost:8000/api/v1/alerts/?limit=5

# Get alert stats (should show counts by severity)
curl http://localhost:8000/api/v1/alerts/stats
```

| # | Endpoint | Expected Response | Verified |
|---|----------|-------------------|----------|
| 1 | `/system/health` | `{"status":"operational",...}` | [ ] |
| 2 | `/flows/?limit=5` | Array with 5 flow objects | [ ] |
| 3 | `/flows/stats` | Object with total_flows > 0 | [ ] |
| 4 | `/alerts/?limit=5` | Array with 5 alert objects | [ ] |
| 5 | `/alerts/stats` | Object with severity counts | [ ] |

---

## Design System Compliance

| # | Element | Expected | Verified |
|---|---------|----------|----------|
| 1 | Background color | `#0a0a0f` (deep black) | [ ] |
| 2 | Primary accent | `#00f0ff` (cyber cyan) | [ ] |
| 3 | Critical color | `#ef4444` (red) | [ ] |
| 4 | Warning color | `#f59e0b` (amber) | [ ] |
| 5 | Safe color | `#22c55e` (green) | [ ] |
| 6 | Data font | JetBrains Mono (monospace) | [ ] |
| 7 | UI font | Inter (sans-serif) | [ ] |
| 8 | Glass panels | Semi-transparent with blur | [ ] |
| 9 | Scan line animation | Subtle horizontal line moving | [ ] |
| 10 | Pulsing alerts | Critical alerts pulse/breathe | [ ] |

---

## Final Verification Summary

| Category | Items | Verified | Pass Rate |
|----------|-------|----------|-----------|
| Metric Cards | 4 | /4 | % |
| Threat Map | 5 | /5 | % |
| Protocol Chart | 3 | /3 | % |
| Traffic Timeline | 4 | /4 | % |
| Threat Level | 3 | /3 | % |
| AI Briefing | 3 | /3 | % |
| Alert Feed | 4 | /4 | % |
| Top Talkers | 3 | /3 | % |
| Geo Distribution | 3 | /3 | % |
| WebSocket | 4 | /4 | % |
| API Endpoints | 5 | /5 | % |
| Design System | 10 | /10 | % |
| **TOTAL** | **51** | **/51** | **%** |

---

## Issues Found

| # | Component | Issue Description | Severity | Status |
|---|-----------|-------------------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Sign-Off

- [ ] All critical components verified
- [ ] No JavaScript console errors
- [ ] Data flows from API → hooks → components
- [ ] Real-time updates working via WebSocket
- [ ] Design system compliance confirmed

**Verified By:** _______________  
**Date:** _______________  
**Status:** ☐ PASS ☐ PARTIAL ☐ FAIL