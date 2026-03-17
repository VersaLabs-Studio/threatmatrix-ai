'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Reports Page
// Automated security summaries and performance logs
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { DataTable }  from '@/components/shared/DataTable';
import { MOCK_REPORTS } from '@/lib/mock-data';
import { FileText, Download, Play, Calendar, Filter, Clock } from 'lucide-react';

const REPORT_TYPES = [
  { id: 'daily',   title: 'Daily Threat Summary', desc: 'Consolidated view of all blocked threats in last 24h', icon: <Clock size={20} /> },
  { id: 'incident', title: 'Incident Deep Dive',  desc: 'Technical breakdown of specific critical alerts', icon: <FileText size={20} /> },
  { id: 'exec',     title: 'Executive Briefing',   desc: 'High-level risk heatmaps for board reporting', icon: <Filter size={20} /> },
  { id: 'ml',       title: 'ML Performance',       desc: 'Drift analysis and confusion matrix audits', icon: <Play size={20} /> },
  { id: 'net',      title: 'Network Health',       desc: 'Bandwidth utilization and latency anomalies', icon: <Calendar size={20} /> },
  { id: 'comp',     title: 'Compliance Audit',     desc: 'SOC2/ISO27001 mapping for flow logs', icon: <FileText size={20} /> },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 3000); // Simulated delay
  };

  const HISTORY_COLUMNS = [
    { key: 'name',   header: 'REPORT NAME', width: 220, render: (r: any) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'type',   header: 'TYPE',        width: 100, render: (r: any) => <span style={{ opacity: 0.7 }}>{r.type}</span> },
    { key: 'date',   header: 'DATE',        width: 100 },
    { key: 'status', header: 'STATUS',      width: 100, render: (r: any) => (
      <span style={{ 
        fontSize: '0.6rem', 
        color: r.status === 'completed' ? 'var(--success)' : 'var(--critical)',
        textTransform: 'uppercase',
        fontWeight: 700 
      }}>
        {r.status}
      </span>
    )},
    { key: 'size',   header: 'SIZE',        width: 80, render: (r: any) => <span style={{ color: 'var(--text-muted)' }}>{r.size}</span> },
    { key: 'actions', header: 'ACTION',      width: 80, render: (r: any) => (
      <button style={{ background: 'none', border: 'none', cursor: r.status === 'completed' ? 'pointer' : 'default', color: r.status === 'completed' ? 'var(--cyan)' : 'var(--text-muted)' }}>
        <Download size={14} />
      </button>
    )},
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
          REPORTS
        </h1>
      </header>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
              AUTO-GENERATED REPORTING
            </h1>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              Compliance-Ready PDF & HTML Export Engine
            </p>
          </div>
        </div>

        {/* Grid: Report Generation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
          {REPORT_TYPES.map(type => (
            <GlassPanel key={type.id} static>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ color: 'var(--cyan)', opacity: 0.8 }}>{type.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 800, margin: '0 0 4px 0' }}>{type.title}</h3>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>{type.desc}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleGenerate(type.id)}
                      disabled={generating === type.id}
                      style={{
                        background: generating === type.id ? 'var(--bg-tertiary)' : 'var(--cyan)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 12px',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        color: generating === type.id ? 'var(--text-muted)' : 'var(--bg-dark)',
                        cursor: generating === type.id ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {generating === type.id ? 'GENERATING...' : 'GENERATE PDF'}
                      {generating !== type.id && <Play size={10} />}
                    </button>
                    <button style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      CONFIG
                    </button>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* Report History */}
        <GlassPanel static title="RECENT REPORT HISTORY" icon="🕒">
          <DataTable
            columns={HISTORY_COLUMNS}
            data={MOCK_REPORTS}
            rowKey={(r) => r.id}
            maxHeight={300}
          />
        </GlassPanel>

    </div>
  );
}
