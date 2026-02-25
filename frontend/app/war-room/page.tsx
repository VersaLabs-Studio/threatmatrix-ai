import styles from "./war-room.module.css";

export default function WarRoom() {
  return (
    <div className={styles.warRoom}>
      {/* Scan line overlay */}
      <div className={styles.scanline} />

      {/* Header bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4L6 14V34L24 44L42 34V14L24 4Z"
              stroke="var(--cyan)"
              strokeWidth="1.5"
            />
            <path
              d="M24 12L14 18V30L24 36L34 30V18L24 12Z"
              stroke="var(--cyan)"
              strokeWidth="1"
              fill="var(--cyan-muted)"
            />
            <circle cx="24" cy="24" r="3" fill="var(--cyan)" />
          </svg>
          <span className={styles.headerTitle}>THREATMATRIX</span>
          <span className={styles.headerDivider}>|</span>
          <span className={styles.headerModule}>WAR ROOM</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.threatBadge}>
            <span className={styles.threatDot} />
            THREAT LEVEL: <span className={styles.threatValue}>ELEVATED</span>
          </div>
          <div className={styles.timestamp}>
            {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className={styles.grid}>
        {/* Left column — Threat Map placeholder */}
        <div className={styles.mapPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelIcon}>🌐</span>
            <span className={styles.panelTitle}>LIVE THREAT MAP</span>
            <span className="status-dot status-dot--live" />
          </div>
          <div className={styles.mapPlaceholder}>
            <div className={styles.mapGrid} />
            <div className={styles.mapCenter}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="var(--cyan)"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="18"
                  stroke="var(--cyan)"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  opacity="0.2"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="6"
                  fill="var(--cyan)"
                  opacity="0.15"
                />
                <circle cx="32" cy="32" r="2" fill="var(--cyan)" />
                <line
                  x1="32"
                  y1="0"
                  x2="32"
                  y2="64"
                  stroke="var(--cyan)"
                  strokeWidth="0.3"
                  opacity="0.15"
                />
                <line
                  x1="0"
                  y1="32"
                  x2="64"
                  y2="32"
                  stroke="var(--cyan)"
                  strokeWidth="0.3"
                  opacity="0.15"
                />
              </svg>
              <span className={styles.mapLabel}>DECK.GL + MAPLIBRE</span>
              <span className={styles.mapSublabel}>Awaiting integration</span>
            </div>
          </div>
        </div>

        {/* Right column — Metrics + Charts */}
        <div className={styles.rightColumn}>
          {/* Metric cards */}
          <div className={styles.metricsRow}>
            <MetricCard label="PACKETS/SEC" value="—" accent="cyan" />
            <MetricCard label="ACTIVE FLOWS" value="—" accent="cyan" />
            <MetricCard label="ANOMALY RATE" value="—" accent="warning" />
            <MetricCard label="THREATS (24H)" value="—" accent="critical" />
          </div>

          {/* Protocol distribution placeholder */}
          <div className={`glass-panel-static ${styles.chartPanel}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>📡</span>
              <span className={styles.panelTitle}>PROTOCOL DISTRIBUTION</span>
            </div>
            <div className={styles.protocolBars}>
              <ProtocolBar label="TCP" percent={62} color="var(--cyan)" />
              <ProtocolBar label="UDP" percent={24} color="var(--info)" />
              <ProtocolBar label="ICMP" percent={8} color="var(--warning)" />
              <ProtocolBar
                label="OTHER"
                percent={6}
                color="var(--text-muted)"
              />
            </div>
          </div>

          {/* Traffic timeline placeholder */}
          <div className={`glass-panel-static ${styles.chartPanel}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>📈</span>
              <span className={styles.panelTitle}>TRAFFIC TIMELINE</span>
              <span className={styles.panelBadge}>60 MIN</span>
            </div>
            <div className={styles.timelinePlaceholder}>
              <svg viewBox="0 0 400 80" className={styles.timelineSvg}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--cyan)"
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--cyan)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M0,60 Q20,55 40,50 T80,45 T120,40 T160,38 T200,42 T240,35 T280,30 T320,25 T360,20 T400,22"
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                <path
                  d="M0,60 Q20,55 40,50 T80,45 T120,40 T160,38 T200,42 T240,35 T280,30 T320,25 T360,20 T400,22 L400,80 L0,80 Z"
                  fill="url(#areaGrad)"
                />
                {/* Anomaly spike */}
                <circle
                  cx="280"
                  cy="30"
                  r="4"
                  fill="var(--critical)"
                  opacity="0.6"
                />
                <circle
                  cx="280"
                  cy="30"
                  r="8"
                  fill="none"
                  stroke="var(--critical)"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </svg>
              <div className={styles.timelineLabel}>
                SAMPLE DATA — AWAITING LIVE CAPTURE
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row — Alert feed + Top threats + AI briefing */}
        <div className={styles.bottomRow}>
          {/* Alert feed */}
          <div className={`glass-panel-static ${styles.alertPanel}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>🚨</span>
              <span className={styles.panelTitle}>LIVE ALERT FEED</span>
              <span className="status-dot status-dot--idle" />
            </div>
            <div className={styles.alertList}>
              <AlertRow
                severity="critical"
                time="--:--:--"
                text="Awaiting capture engine..."
              />
              <AlertRow
                severity="high"
                time="--:--:--"
                text="ML models loading..."
              />
              <AlertRow
                severity="medium"
                time="--:--:--"
                text="Intel feeds syncing..."
              />
              <AlertRow
                severity="low"
                time="--:--:--"
                text="System initializing..."
              />
            </div>
          </div>

          {/* Top threats */}
          <div className={`glass-panel-static ${styles.threatsPanel}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>🎯</span>
              <span className={styles.panelTitle}>TOP THREATS</span>
            </div>
            <div className={styles.threatsList}>
              <ThreatRow rank={1} label="DDoS" score={0} />
              <ThreatRow rank={2} label="Port Scan" score={0} />
              <ThreatRow rank={3} label="DNS Tunnel" score={0} />
              <ThreatRow rank={4} label="Brute Force" score={0} />
            </div>
          </div>

          {/* AI briefing */}
          <div className={`glass-panel-static ${styles.briefingPanel}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>🤖</span>
              <span className={styles.panelTitle}>AI BRIEFING</span>
              <span className={styles.panelBadge}>DEEPSEEK</span>
            </div>
            <div className={styles.briefingText}>
              <span className={styles.briefingCursor} />
              <p>
                Awaiting connection to Intelligence Engine. AI Analyst will
                provide real-time threat narratives, network health summaries,
                and actionable recommendations once the capture pipeline is
                active.
              </p>
              <p className={styles.briefingMeta}>
                — ThreatMatrix AI Analyst • Standby
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <footer className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className="status-dot status-dot--idle" />
          <span>CAPTURE: IDLE</span>
        </div>
        <div className={styles.statusItem}>
          <span className="status-dot status-dot--idle" />
          <span>ML ENGINE: STANDBY</span>
        </div>
        <div className={styles.statusItem}>
          <span className="status-dot status-dot--idle" />
          <span>INTEL FEEDS: DISCONNECTED</span>
        </div>
        <div className={styles.statusItem}>
          <span className="status-dot status-dot--idle" />
          <span>LLM: OFFLINE</span>
        </div>
        <div className={styles.statusSpacer} />
        <div className={styles.statusItem}>
          <span>v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Inline Sub-Components ──────────────────────────────────── */

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const accentColor =
    accent === "cyan"
      ? "var(--cyan)"
      : accent === "warning"
        ? "var(--warning)"
        : accent === "critical"
          ? "var(--critical)"
          : "var(--text-primary)";

  return (
    <div
      className="glass-panel-static"
      style={{ padding: "1rem 1.25rem", flex: 1, minWidth: 0 }}
    >
      <div className="metric-label">{label}</div>
      <div
        className="metric-value"
        style={{
          color: accentColor,
          fontSize: "1.75rem",
          marginTop: "0.25rem",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProtocolBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: number;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span
        className="data-text"
        style={{
          width: "3rem",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--bg-tertiary)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: color,
            borderRadius: "var(--radius-full)",
            transition: "width 1s ease",
          }}
        />
      </div>
      <span
        className="data-text"
        style={{
          width: "2.5rem",
          fontSize: "0.7rem",
          color: "var(--text-secondary)",
          textAlign: "right",
        }}
      >
        {percent}%
      </span>
    </div>
  );
}

function AlertRow({
  severity,
  time,
  text,
}: {
  severity: string;
  time: string;
  text: string;
}) {
  const dotClass =
    severity === "critical"
      ? "status-dot--critical"
      : severity === "high"
        ? "status-dot--warning"
        : severity === "medium"
          ? "status-dot--warning"
          : "status-dot--idle";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.375rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className={`status-dot ${dotClass}`} />
      <span
        className="data-text"
        style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {time}
      </span>
      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        {text}
      </span>
    </div>
  );
}

function ThreatRow({
  rank,
  label,
  score,
}: {
  rank: number;
  label: string;
  score: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.375rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        className="data-text"
        style={{
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          width: "1rem",
        }}
      >
        #{rank}
      </span>
      <span
        style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: 1 }}
      >
        {label}
      </span>
      <span
        className="data-text"
        style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
      >
        {score}%
      </span>
    </div>
  );
}
