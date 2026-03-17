'use client';

import { Activity, Zap, Shield, Search, ArrowDown, ArrowUp, BarChart3 } from 'lucide-react';

export default function NetworkFlowPage() {
  const mockFlows = [
    { id: 1, src: '192.168.1.45', dst: '104.21.55.12', proto: 'TCP', size: '254 MB', status: 'ANOMALOUS' },
    { id: 2, src: '10.0.4.12', dst: '8.8.8.8', proto: 'UDP', size: '1.2 GB', status: 'NORMAL' },
    { id: 3, src: '172.16.0.4', dst: '45.33.22.11', proto: 'TCP', size: '45 KB', status: 'ANOMALOUS' },
    { id: 4, src: '192.168.1.12', dst: '1.1.1.1', proto: 'ICMP', size: '400 B', status: 'NORMAL' },
  ];

  return (
    <div className="page-enter" style={{ padding: 'var(--space-4)' }}>
      <header className="mb-6 flex justify-between items-center text-primary">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="text-[var(--cyan)]" size={32} />
            Network Flow Analysis
          </h1>
          <p className="text-[var(--text-muted)] font-mono text-sm mt-1">
            CAPTURE: <span className="text-[var(--cyan)] animate-pulse">0.02ms LATENCY</span>
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel-static flex items-center gap-6 py-2 px-6">
            <div className="flex items-center gap-2">
              <ArrowUp size={14} className="text-[var(--cyan)]" />
              <span className="font-mono text-xs">18.4 Gbps</span>
            </div>
            <div className="flex items-center gap-2 border-l border-[var(--glass-border)] pl-6">
              <ArrowDown size={14} className="text-[var(--purple)]" />
              <span className="font-mono text-xs">4.2 Gbps</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid-3 mb-8">
        <div className="glass-panel glass-panel-noise">
          <h3 className="metric-label mb-2">Active Connections</h3>
          <div className="metric-value metric-value--cyan">14,205</div>
          <div className="mt-2 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--cyan)] w-3/4 animate-pulse"></div>
          </div>
        </div>
        <div className="glass-panel glass-panel-noise">
          <h3 className="metric-label mb-2">Protocol Distribution</h3>
          <div className="flex items-center justify-between text-xs font-mono mt-2">
            <span>TCP: 82%</span>
            <span>UDP: 14%</span>
            <span>ICMP: 4%</span>
          </div>
          <div className="mt-2 h-1 flex rounded-full overflow-hidden">
            <div className="h-full bg-[var(--cyan)] w-[82%]"></div>
            <div className="h-full bg-[var(--purple)] w-[14%]"></div>
            <div className="h-full bg-[var(--text-muted)] w-[4%]"></div>
          </div>
        </div>
        <div className="glass-panel glass-panel-noise">
          <h3 className="metric-label mb-2">Anomaly Score (avg)</h3>
          <div className="metric-value text-[var(--warning)]">24.5%</div>
          <p className="text-[var(--text-muted)] text-[10px] mt-1 font-mono">+1.2% VS PREV HOUR</p>
        </div>
      </div>

      <div className="glass-panel mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-[var(--text-secondary)]" />
            Live Traffic Flow
          </h2>
          <div className="flex gap-2">
            <button className="btn-aether py-1 px-3 text-xs">CSV EXPORT</button>
            <button className="btn-aether py-1 px-3 text-xs">PCAP CAPTURE</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-[var(--text-muted)] border-b border-[var(--glass-border)]">
              <tr>
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">SOURCE IP</th>
                <th className="pb-3 pr-4">DESTINATION IP</th>
                <th className="pb-3 pr-4">PROTOCOL</th>
                <th className="pb-3 pr-4">FLOW SIZE</th>
                <th className="pb-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              {mockFlows.map(flow => (
                <tr key={flow.id} className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--cyan-muted)] transition-colors">
                  <td className="py-4 pr-4 text-[var(--text-muted)]">{flow.id}</td>
                  <td className="py-4 pr-4">{flow.src}</td>
                  <td className="py-4 pr-4">{flow.dst}</td>
                  <td className="py-4 pr-4">{flow.proto}</td>
                  <td className="py-4 pr-4">{flow.size}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      flow.status === 'ANOMALOUS' 
                        ? 'bg-[var(--critical-dim)] text-[var(--critical)] border border-[var(--critical)]' 
                        : 'bg-[var(--safe-dim)] text-[var(--safe)] border border-[var(--safe)]'
                    }`}>
                      {flow.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

