'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Reports (v0.6.0)
// PDF Report Generation and History
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { FileText, Download, Calendar, Clock, CheckCircle } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'daily' | 'incident' | 'executive' | 'ml_performance';
  generated: string;
  size: string;
  status: 'ready' | 'generating';
}

// Mock Reports
const MOCK_REPORTS: Report[] = [
  { id: 'rpt-001', title: 'Daily Threat Summary — Mar 12', type: 'daily', generated: '2026-03-12 06:00', size: '2.4 MB', status: 'ready' },
  { id: 'rpt-002', title: 'DDoS Incident Report — Mar 11', type: 'incident', generated: '2026-03-11 22:30', size: '1.8 MB', status: 'ready' },
  { id: 'rpt-003', title: 'Executive Briefing — Week 10', type: 'executive', generated: '2026-03-10 09:00', size: '3.1 MB', status: 'ready' },
  { id: 'rpt-004', title: 'ML Performance Report — Mar', type: 'ml_performance', generated: '2026-03-09 14:00', size: '4.2 MB', status: 'ready' },
];

const TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Summary',
  incident: 'Incident Report',
  executive: 'Executive Briefing',
  ml_performance: 'ML Performance',
};

const TYPE_COLORS: Record<string, string> = {
  daily: 'var(--cyan)',
  incident: 'var(--critical)',
  executive: 'var(--info)',
  ml_performance: 'var(--safe)',
};

export default function ReportsPage() {
  const [reports] = useState<Report[]>(MOCK_REPORTS);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            PDF report generation and history
          </p>
        </div>
        <button className="glass-panel" style={{
          padding: '10px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderColor: 'var(--cyan)',
          color: 'var(--cyan)',
          fontWeight: 600,
        }}>
          <FileText size={16} /> Generate Report
        </button>
      </div>

      {/* Report Types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <GlassPanel key={key} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[key], margin: '0 auto var(--space-2)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
          </GlassPanel>
        ))}
      </div>

      {/* Reports List */}
      <GlassPanel>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
          <Calendar size={18} style={{ marginRight: 8, color: 'var(--cyan)' }} />
          Generated Reports
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {reports.map(report => (
            <div key={report.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <FileText size={20} style={{ color: TYPE_COLORS[report.type] }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
                  {report.title}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {report.generated}
                  </span>
                  <span>{report.size}</span>
                  <span style={{ color: TYPE_COLORS[report.type] }}>{TYPE_LABELS[report.type]}</span>
                </div>
              </div>
              {report.status === 'ready' ? (
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                }}>
                  <Download size={14} /> PDF
                </button>
              ) : (
                <span style={{ color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>Generating...</span>
              )}
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
