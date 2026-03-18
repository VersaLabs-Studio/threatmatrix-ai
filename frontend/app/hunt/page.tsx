'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Threat Hunt (v0.4.0)
// Query Builder and Flow Search Analysis
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { DataTable }  from '@/components/shared/DataTable';
import { Search, Filter, Download, Bot } from 'lucide-react';

interface Flow {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  protocol: string;
  bytes: number;
  score: number;
  label: string;
}

// Mock Flow Data
const MOCK_FLOWS: Flow[] = [
  { id: 'f-001', timestamp: '22:14:03', src_ip: '10.0.1.5', dst_ip: '8.8.8.8', protocol: 'UDP', bytes: 4520, score: 0.94, label: 'DDoS' },
  { id: 'f-002', timestamp: '22:13:58', src_ip: '10.0.1.5', dst_ip: 'evil.com', protocol: 'TCP', bytes: 1240, score: 0.87, label: 'C2' },
  { id: 'f-003', timestamp: '22:13:42', src_ip: '192.168.1.1', dst_ip: '10.0.1.100', protocol: 'TCP', bytes: 890, score: 0.72, label: 'Scan' },
  { id: 'f-004', timestamp: '22:13:30', src_ip: '10.0.1.12', dst_ip: '10.0.1.1', protocol: 'ICMP', bytes: 128, score: 0.15, label: 'Normal' },
  { id: 'f-005', timestamp: '22:13:15', src_ip: '10.0.1.8', dst_ip: '185.220.101.4', protocol: 'TCP', bytes: 3200, score: 0.81, label: 'C2' },
];

export default function ThreatHuntPage() {
  const [search, setSearch] = useState('');
  const [protocol, setProtocol] = useState('all');

  const filtered = MOCK_FLOWS.filter(f => {
    const matchSearch = f.src_ip.includes(search) || f.dst_ip.includes(search) || f.label.toLowerCase().includes(search.toLowerCase());
    const matchProtocol = protocol === 'all' || f.protocol === protocol;
    return matchSearch && matchProtocol;
  });

  const COLUMNS = [
    { key: 'timestamp', header: 'TIME', width: 80, render: (r: Flow) => <span style={{ fontFamily: 'var(--font-data)', color: 'var(--text-muted)' }}>{r.timestamp}</span> },
    { key: 'src_ip', header: 'SOURCE IP', width: 140, render: (r: Flow) => <code style={{ color: 'var(--cyan)' }}>{r.src_ip}</code> },
    { key: 'dst_ip', header: 'DEST IP', width: 140, render: (r: Flow) => <code style={{ color: 'var(--text-secondary)' }}>{r.dst_ip}</code> },
    { key: 'protocol', header: 'PROTO', width: 70, render: (r: Flow) => <span style={{ fontWeight: 600 }}>{r.protocol}</span> },
    { key: 'bytes', header: 'BYTES', width: 90, render: (r: Flow) => <span style={{ fontFamily: 'var(--font-data)' }}>{r.bytes.toLocaleString()}</span> },
    { key: 'score', header: 'SCORE', width: 80, render: (r: Flow) => (
      <span style={{ fontFamily: 'var(--font-data)', color: r.score > 0.8 ? 'var(--critical)' : r.score > 0.5 ? 'var(--warning)' : 'var(--safe)' }}>{r.score.toFixed(2)}</span>
    )},
    { key: 'label', header: 'LABEL', width: 100, render: (r: Flow) => (
      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: r.score > 0.8 ? 'var(--critical-dim)' : 'var(--info-dim)', color: r.score > 0.8 ? 'var(--critical)' : 'var(--info)' }}>{r.label}</span>
    )},
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Threat Hunt
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Query builder and flow search analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="glass-panel" style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="glass-panel" style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>
            <Bot size={14} /> Analyze with AI
          </button>
        </div>
      </div>

      {/* Query Builder */}
      <GlassPanel style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by IP, label..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontFamily: 'var(--font-ui)' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['all', 'TCP', 'UDP', 'ICMP'].map(p => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${protocol === p ? 'var(--cyan)' : 'var(--border)'}`,
                  background: protocol === p ? 'var(--cyan-dim)' : 'transparent',
                  color: protocol === p ? 'var(--cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Results */}
      <GlassPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            <Filter size={14} style={{ marginRight: 8 }} />
            {filtered.length} flows matching
          </span>
        </div>
        <DataTable columns={COLUMNS} data={filtered} rowKey={(row: Flow) => row.id} />
      </GlassPanel>
    </div>
  );
}
