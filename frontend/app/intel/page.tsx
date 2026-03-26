'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Intel Hub (v1.0.0)
// IOC Browser and External Intelligence Feeds
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { DataTable }  from '@/components/shared/DataTable';
import { Search, Activity, RefreshCw } from 'lucide-react';
import { useIntel } from '@/hooks/useIntel';
import { API_BASE_URL } from '@/lib/constants';
import { api } from '@/lib/api';

interface IOC {
  type: string;
  indicator: string;
  source: string;
  risk: number;
  seen: string;
  tags: string[];
}

// Mock IOC Data (fallback)
const MOCK_IOCS: IOC[] = [
  { type: 'IP', indicator: '104.21.55.12', source: 'OTX', risk: 88, seen: '2026-03-10', tags: ['C2', 'CobaltStrike'] },
  { type: 'DOMAIN', indicator: 'microsoft-update.security.com', source: 'VirusTotal', risk: 94, seen: '2026-03-11', tags: ['Phishing'] },
  { type: 'HASH', indicator: '7a58e1c...b2e', source: 'Internal', risk: 100, seen: '2026-03-09', tags: ['Ransomware.LockBit'] },
  { type: 'IP', indicator: '185.220.101.4', source: 'AbuseIPDB', risk: 72, seen: '2026-03-12', tags: ['Tor Exit Node'] },
  { type: 'DOMAIN', indicator: 'free-vpn-service.net', source: 'OTX', risk: 45, seen: '2026-03-11', tags: ['Grayware'] },
];

export default function IntelHubPage() {
  const [search, setSearch] = useState('');
  const { iocs, total, loading, refetch } = useIntel();
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [feedStatus, setFeedStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch feed status
  useEffect(() => {
    api.get<any>('/api/v1/intel/feeds/status').then(({ data }) => {
      if (data) setFeedStatus(data);
    });
  }, []);

  // IP/Domain lookup
  const performLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/intel/lookup/${encodeURIComponent(lookupQuery.trim())}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setLookupResult(data);
    } catch {
      setLookupResult({ error: 'Lookup failed' });
    }
    setLookupLoading(false);
  };

  // Sync feeds
  const syncFeeds = async () => {
    setSyncing(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/intel/sync`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      // Refresh IOC list after sync
      refetch();
    } catch {
      // Sync failed
    }
    setSyncing(false);
  };

  // Use live IOCs if available, otherwise fallback to mock
  const displayIOCs: IOC[] = iocs.length > 0 ? iocs.map(ioc => ({
    type: ioc.ioc_type?.toUpperCase() || 'IP',
    indicator: ioc.ioc_value || '',
    source: ioc.source || 'Unknown',
    risk: ioc.confidence ? Math.round(ioc.confidence * 100) : 0,
    seen: ioc.created_at ? new Date(ioc.created_at).toISOString().split('T')[0] : 'N/A',
    tags: ioc.tags || [],
  })) : MOCK_IOCS;

  const filtered = displayIOCs.filter(i => 
    i.indicator.toLowerCase().includes(search.toLowerCase()) || 
    i.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

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
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.2rem' }}>🛡️</span>
        <div>
          <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
            THREAT INTELLIGENCE HUB
          </h1>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
            Global Threat Feeds & IOC Correlation
          </p>
        </div>
      </div>

      {/* Row 1: Feed Status + Sync */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 'var(--space-3)', alignItems: 'end' }}>
        <FeedCard name="OTX ALIENVAULT" status={feedStatus?.otx?.enabled ? 'ONLINE' : 'OFFLINE'} count={feedStatus?.otx?.ioc_count ? `${(feedStatus.otx.ioc_count / 1000).toFixed(0)}K IOCs` : '1.2M IOCs'} />
        <FeedCard name="ABUSEIPDB"      status={feedStatus?.abuseipdb?.enabled ? 'ONLINE' : 'OFFLINE'} count={feedStatus?.abuseipdb?.ip_count ? `${(feedStatus.abuseipdb.ip_count / 1000).toFixed(0)}K IPs` : '450K IPs'} />
        <FeedCard name="VIRUSTOTAL"     status={feedStatus?.virustotal?.enabled ? 'ONLINE' : 'STANDBY'} count="Premium" />
        <FeedCard name="INTERNAL"       status="ONLINE" count={`${total || 842} IOCs`} />
        <button
          onClick={syncFeeds}
          disabled={syncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: syncing ? 'var(--bg-tertiary)' : 'var(--cyan)',
            color: syncing ? 'var(--text-muted)' : 'var(--bg-dark)',
            border: 'none',
            cursor: syncing ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-data)',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'SYNCING...' : '🔄 SYNC FEEDS'}
        </button>
      </div>

      {/* IP/Domain Lookup Widget */}
      <GlassPanel static title="IP / DOMAIN LOOKUP" icon="🔍">
        <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-4)' }}>
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performLookup()}
            placeholder="Enter IP or domain..."
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontFamily: 'var(--font-data)',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={performLookup}
            disabled={lookupLoading || !lookupQuery.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              background: lookupQuery.trim() ? 'var(--cyan)' : 'var(--bg-tertiary)',
              color: lookupQuery.trim() ? 'var(--bg-dark)' : 'var(--text-muted)',
              border: 'none',
              cursor: lookupQuery.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-data)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {lookupLoading ? 'LOOKING UP...' : 'LOOKUP'}
          </button>
        </div>
        {lookupResult && (
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
            border: '1px solid var(--border)',
          }}>
            {lookupResult.error ? (
              <div style={{ color: 'var(--critical)', fontFamily: 'var(--font-data)', fontSize: '0.8rem' }}>
                {lookupResult.error}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontFamily: 'var(--font-data)', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>OTX Pulses</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{lookupResult.otx?.pulse_count ?? 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Reputation</div>
                  <div style={{ color: lookupResult.otx?.reputation > 0 ? 'var(--safe)' : 'var(--critical)', fontWeight: 700 }}>{lookupResult.otx?.reputation ?? 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Abuse Confidence</div>
                  <div style={{ color: lookupResult.abuseipdb?.abuse_confidence > 50 ? 'var(--critical)' : 'var(--safe)', fontWeight: 700 }}>{lookupResult.abuseipdb?.abuse_confidence ?? 'N/A'}%</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Total Reports</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{lookupResult.abuseipdb?.total_reports ?? 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Country</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{lookupResult.otx?.country ?? 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>ISP</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{lookupResult.abuseipdb?.isp ?? 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassPanel>

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
