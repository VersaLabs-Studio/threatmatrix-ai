'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Alert Console Page (v0.4.0)
// Triage and manage security incidents
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useAlerts }      from '@/hooks/useAlerts';
import { DataTable }     from '@/components/shared/DataTable';
import { StatusBadge }   from '@/components/shared/StatusBadge';
import { AlertDetailDrawer } from '@/components/alerts/AlertDetailDrawer';
import { formatTime, formatIP } from '@/lib/utils';
import { GlassPanel }    from '@/components/shared/GlassPanel';
import type { AlertResponse } from '@/lib/types';
import type { Severity, AlertStatus } from '@/lib/constants';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AlertConsolePage() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter]     = useState<AlertStatus | 'all'>('all');
  const [selectedAlert, setSelectedAlert]   = useState<AlertResponse | null>(null);

  const { alerts, loading, updateStatus } = useAlerts({ 
    severity: severityFilter, 
    status: statusFilter, 
    limit: 100 
  });

  const COLUMNS = [
    { 
      key: 'severity', 
      header: 'Sev', 
      width: 80, 
      render: (r: AlertResponse) => <StatusBadge severity={r.severity} /> 
    },
    { 
      key: 'title', 
      header: 'Title', 
      width: 250 
    },
    { 
      key: 'source_ip', 
      header: 'Source IP', 
      width: 130, 
      render: (r: AlertResponse) => formatIP(r.source_ip || '') 
    },
    { 
      key: 'confidence', 
      header: 'Score', 
      width: 70, 
      render: (r: AlertResponse) => (
        <span style={{ color: (r.confidence || 0) > 0.8 ? 'var(--critical)' : 'var(--warning)', fontWeight: 600 }}>
          {((r.confidence || 0) * 100).toFixed(0)}%
        </span>
      )
    },
    { 
      key: 'created_at', 
      header: 'Time', 
      width: 100, 
      render: (r: AlertResponse) => formatTime(r.created_at) 
    },
    { 
      key: 'status', 
      header: 'Status', 
      width: 100, 
      render: (r: AlertResponse) => (
        <span style={{ 
          fontSize: '0.65rem', 
          color: r.status === 'open' ? 'var(--warning)' : 'var(--text-muted)',
          textTransform: 'uppercase',
          fontWeight: 700 
        }}>
          {r.status}
        </span>
      )
    },
  ];

  return (
    <AuthGuard>
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
                INCIDENT ALERT CONSOLE
              </h1>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                Live monitoring · {alerts.length} alerts in queue
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <FilterGroup 
            label="SEVERITY" 
            options={['all', 'critical', 'high', 'medium', 'low']} 
            current={severityFilter} 
            onSelect={(v: string) => setSeverityFilter(v as any)} 
          />
          <FilterGroup 
            label="STATUS" 
            options={['all', 'open', 'acknowledged', 'resolved']} 
            current={statusFilter} 
            onSelect={(v: string) => setStatusFilter(v as any)} 
          />
        </div>

        {/* Main Table */}
        <GlassPanel static title="INCIDENT QUEUE" icon="📋">
          <DataTable
            columns={COLUMNS}
            data={alerts}
            loading={loading}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedAlert(r as AlertResponse)}
            maxHeight="calc(100vh - 280px)"
          />
        </GlassPanel>

        {/* Detail Drawer */}
        <AlertDetailDrawer 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)} 
          onUpdateStatus={updateStatus}
        />
      </div>
    </AuthGuard>
  );
}

function FilterGroup({ label, options, current, onSelect }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}:</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${current === opt ? 'var(--cyan)' : 'var(--border)'}`,
              background: current === opt ? 'rgba(0,255,255,0.1)' : 'var(--bg-tertiary)',
              color: current === opt ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
