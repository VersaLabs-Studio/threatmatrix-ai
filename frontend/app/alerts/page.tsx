'use client';

import { mockAlerts } from '@/lib/mock-data/alerts';
import { Shield, Search, Filter, ArrowUpRight } from 'lucide-react';

export default function AlertConsolePage() {
  return (
    <div className="page-enter" style={{ padding: 'var(--space-4)' }}>
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="text-[var(--cyan)]" size={32} />
            Incident Alert Console
          </h1>
          <p className="text-[var(--text-muted)] font-mono text-sm mt-1">
            MONITORING: <span className="text-[var(--safe)] animate-pulse">ALL SYSTEMS NOMINAL</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel-static flex items-center gap-2 py-2 px-4">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Filter alerts..." 
              className="bg-transparent border-none outline-none font-mono text-sm text-primary placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button className="btn-aether">
            <Filter size={16} /> Advanced Filters
          </button>
        </div>
      </header>

      <div className="grid gap-4">
        {mockAlerts.map(alert => (
          <div key={alert.id} className="glass-panel glass-panel-noise hover:scale-[1.01] transition-transform cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`p-3 rounded-lg bg-[var(--${alert.severity}-dim)] border border-[var(--${alert.severity})] flex items-center justify-center`}>
                  <Shield size={24} className={`text-[var(--${alert.severity})]`} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`severity-badge severity-badge--${alert.severity}`}>{alert.severity}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{alert.id} • {new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{alert.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm max-w-2xl">{alert.description}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="bg-[var(--bg-elevated)] px-3 py-1 rounded border border-[var(--border)] font-mono text-xs">
                  SRC_IP: {alert.sourceIp}
                </div>
                <div className="flex items-center gap-2 text-[var(--cyan)] font-mono text-xs group">
                  VIEW INCIDENT DETAILS <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

