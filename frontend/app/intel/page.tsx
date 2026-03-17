'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Intel Hub (v0.4.0)
// IOC Browser and External Intelligence Feeds
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { DataTable }  from '@/components/shared/DataTable';
import { useIntel } from '@/hooks/useIntel';
import { Search, Activity, RefreshCw } from 'lucide-react';
import type { IOC } from '@/lib/mock-data';

export default function IntelHubPage() {
  const [search, setSearch] = useState('');
  const { syncing, syncFeeds, searchIOCs, feeds } = useIntel();

  const filtered = searchIOCs(search);

  const COLUMNS = [
    { key: 'type',      header: 'TYPE',  width: 70, render: (r: IOC) => <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{r.type}</span> },
    { key: 'indicator', header: 'INDICATOR', width: 220, render: (r: IOC) => <code style={{ color: 'var(--cyan)' }}>{r.indicator}</code> },
    { key: 'source',    header: 'SOURCE', width: 100 },
    { key: 'risk',      header: 'RISK',   width: 70, render: (r: IOC) => (
      <span style={{ color: r.risk > 80 ? 'var(--critical)' : r.risk > 50 ? 'var(--warning)' : 'var(--info)' }}>{r.risk}%</span>
    )},
    { key: 'tags',      header: 'TAGS',   width: 180, render: (r: IOC) => (
      <div style={{ display: 'flex', gap: 4 }}>
        {r.tags.map((t: string) => (
          <span key={t} style={{ fontSize: '0.6rem', padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>{t}</span>
        ))}
      </div>
    )},
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
          INTEL HUB
        </h1>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.2rem' }}>📡</span>
        <div>
          <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
            THREAT INTEL HUB
          </h1>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
            Unified indicator management · {feeds?.length || 0} active feeds
          </p>
        </div>
      </div>

      {/* Row 1: Feed Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        <div style={{ position: 'relative' }}>
           <FeedCard name="OTX ALIENVAULT" status={syncing ? 'STANDBY' : 'ONLINE'} count="1.2M IOCs" />
           {syncing && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}><RefreshCw className="animate-spin" size={12} /></div>}
        </div>
        <FeedCard name="ABUSEIPDB"      status="ONLINE" count="450K IPs" />
        <FeedCard name="VIRUSTOTAL"     status="ONLINE" count="Premium" />
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => syncFeeds()}>
           <FeedCard name="INTERNAL"       status={syncing ? 'ONLINE' : 'STANDBY'} count="842 IOCs" />
           {!syncing && <div style={{ position: 'absolute', top: 8, right: 8, color: 'var(--cyan)', fontSize: '0.6rem' }}>CLICK TO SYNC</div>}
        </div>
      </div>

      {/* Row 2: IOC Browser */}
      <GlassPanel static title="IOC BROWSER" icon="🔍">
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search indicators or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 32px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-data)',
                fontSize: '0.75rem',
              }}
            />
          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          data={filtered}
          rowKey={(r) => r.indicator}
          maxHeight="calc(100vh - 380px)"
        />
      </GlassPanel>

      {/* Row 3: Correlation Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
         <GlassPanel static title="FEED RECENT ACTIVITY" icon="📊">
            <div style={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 4, padding: 10 }}>
               {[40, 70, 45, 90, 65, 80, 55, 30].map((h, i) => (
                 <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--cyan-muted)', borderRadius: 2 }} />
               ))}
            </div>
            <div style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sync activity last 8 hours</div>
         </GlassPanel>
         <GlassPanel static title="LOCAL CORRELATION" icon="🧠">
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
               <Activity size={24} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.5 }} />
               All active flows (past 24h) analyzed against global IOCs.<br />
               <strong>0 matches found in clean traffic.</strong>
            </div>
         </GlassPanel>
      </div>
    </div>
  );
}

interface FeedCardProps {
  name: string;
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE';
  count: string;
}

function FeedCard({ name, status, count }: FeedCardProps) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{count}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', fontWeight: 700, color: status === 'ONLINE' ? 'var(--cyan)' : 'var(--text-muted)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'ONLINE' ? 'var(--cyan)' : 'var(--text-muted)' }} />
          {status}
        </div>
      </div>
    </div>
  );
}
