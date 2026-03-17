'use client';

import { mockIntelFeeds } from '@/lib/mock-data/intel';
import { Search, Globe, Shield, Activity, Target, Zap } from 'lucide-react';

export default function IntelHubPage() {
  return (
    <div className="page-enter" style={{ padding: 'var(--space-4)' }}>
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="text-[var(--purple)]" size={32} />
            Threat Intelligence Hub
          </h1>
          <p className="text-[var(--text-muted)] font-mono text-sm mt-1">
            NETWORK: <span className="text-[var(--purple)] animate-pulse">GLOBAL SYNC ACTIVE</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel-static flex items-center gap-2 py-2 px-4 text-primary">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search threat actors..." 
              className="bg-transparent border-none outline-none font-mono text-sm placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>
      </header>

      <div className="grid-3 mb-8">
        <div className="glass-panel glass-panel-noise">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded bg-[var(--cyan-dim)]">
              <Shield size={20} className="text-[var(--cyan)]" />
            </div>
            <span className="text-[var(--safe)] text-xs font-mono">STABLE</span>
          </div>
          <h3 className="metric-label">OTX AlienVault</h3>
          <div className="metric-value metric-value--cyan mt-1">1.2M IOCs</div>
        </div>
        <div className="glass-panel glass-panel-noise">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded bg-[var(--purple-dim)]">
              <Activity size={20} className="text-[var(--purple)]" />
            </div>
            <span className="text-[var(--safe)] text-xs font-mono">CONNECTED</span>
          </div>
          <h3 className="metric-label">AbuseIPDB</h3>
          <div className="metric-value text-[var(--purple)] mt-1">450K IPs</div>
        </div>
        <div className="glass-panel glass-panel-noise">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded bg-[var(--high-dim)]">
              <Zap size={20} className="text-[var(--high)]" />
            </div>
            <span className="text-[var(--high)] text-xs font-mono opacity-50">SYNCING...</span>
          </div>
          <h3 className="metric-label">VirusTotal</h3>
          <div className="metric-value text-[var(--high)] mt-1">PREMIUM</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Target size={20} className="text-[var(--critical)]" />
        High-Value Target Monitoring
      </h2>
      
      <div className="grid-3">
        {mockIntelFeeds.map(feed => (
          <div key={feed.id} className="glass-panel glass-panel-noise hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <span className="severity-badge severity-badge--high">{feed.type}</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{feed.id}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{feed.actor}</h3>
              <p className="text-[var(--text-muted)] text-xs mb-4">CONFIDENCE: <span className="text-[var(--cyan)]">{feed.confidence}</span></p>
              
              <div className="mt-auto pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)] font-mono">{feed.status}</span>
                <div className="status-dot status-dot--live"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

