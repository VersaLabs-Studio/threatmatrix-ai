import { mockAlerts } from '@/lib/mock-data/alerts';
import { mockNetworkStats } from '@/lib/mock-data/network';
import { ShieldAlert, Activity, Shield, Terminal } from 'lucide-react';

export default function WarRoomPage() {
  const criticalAlerts = mockAlerts.filter(a => a.severity === 'critical');

  return (
    <div className="page-enter">
      <header className="mb-6 flex justify-between items-center text-primary">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-[var(--critical)]" size={32} />
            Command Center
          </h1>
          <p className="text-[var(--text-muted)] font-mono text-sm mt-1">
            SYS.OP.STATUS: <span className="text-[var(--critical)] animate-pulse">DEFCON 3</span>
          </p>
        </div>
        <button className="btn-aether">
          <Terminal size={16} /> Execute Global Lockdown
        </button>
      </header>

      <div className="grid-3 mb-6">
        <div className="glass-panel glass-panel-noise glow-border">
          <h3 className="metric-label mb-2">Active Threats</h3>
          <div className="flex items-center gap-4">
            <span className="metric-value text-[var(--critical)]">{criticalAlerts.length}</span>
            <span className="status-dot status-dot--critical"></span>
          </div>
        </div>
        <div className="glass-panel glass-panel-noise">
          <h3 className="metric-label mb-2">Network Throughput</h3>
          <div className="flex items-center gap-4">
            <span className="metric-value metric-value--cyan">{mockNetworkStats.throughputGbps} Gbps</span>
            <Activity className="text-[var(--cyan)]" size={24} />
          </div>
        </div>
        <div className="glass-panel glass-panel-noise">
          <h3 className="metric-label mb-2">Blocked Requests</h3>
          <div className="flex items-center gap-4">
            <span className="metric-value">{mockNetworkStats.blockedRequests}</span>
            <Shield className="text-[var(--safe)]" size={24} />
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h2 className="text-xl mb-4 border-b border-[var(--glass-border)] pb-2">Active Alerts Feed</h2>
        <div className="flex flex-col gap-3">
          {mockAlerts.map(alert => (
            <div key={alert.id} className="flex items-center justify-between p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`severity-badge severity-badge--${alert.severity}`}>{alert.severity}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{alert.id}</span>
                </div>
                <h4 className="font-semibold">{alert.title}</h4>
              </div>
              <div className="text-right">
                <div className="text-sm text-[var(--text-secondary)]">{alert.sourceIp}</div>
                <div className="text-xs text-[var(--text-muted)]">{new Date(alert.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

