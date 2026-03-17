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
import type { Alert }    from '@/hooks/useAlerts';
import type { Severity, AlertStatus } from '@/lib/constants';

const MOCK_ALERTS: Alert[] = [
  { id: 'al-01', severity: 'critical', category: 'C2 Beaconing', label: 'C2 Beaconing', src_ip: '192.168.1.45', dst_ip: '104.21.55.12', composite_score: 0.94, status: 'open', flow_count: 124, timestamp: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'al-02', severity: 'high',     category: 'Large Exfiltration', label: 'Large Exfiltration', src_ip: '192.168.1.12', dst_ip: '45.33.22.11', composite_score: 0.88, status: 'open', flow_count: 32, timestamp: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'al-03', severity: 'medium',   category: 'Port Scan', label: 'Port Scan', src_ip: '10.0.0.5', dst_ip: '192.168.1.1', composite_score: 0.62, status: 'acknowledged', flow_count: 850, timestamp: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'al-04', severity: 'low',      category: 'Unauthorized Login', label: 'Unauthorized Login', src_ip: '172.16.0.4', dst_ip: '172.16.0.10', composite_score: 0.45, status: 'open', flow_count: 1, timestamp: new Date().toISOString(), updated_at: new Date().toISOString() },
];


export default function AlertConsolePage() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter,   setStatusFilter]   = useState<AlertStatus | 'all'>('all');
  const [selectedAlert,  setSelectedAlert]  = useState<Alert | null>(null);

  const { alerts: apiAlerts, loading, updateStatus, assignToMe } = useAlerts({ 
    severity: severityFilter, 
    status: statusFilter, 
    limit: 100 
  });

  // Use mocks if API is empty (for demo/dev)
  const alerts = apiAlerts.length > 0 ? apiAlerts : MOCK_ALERTS.filter(a => 
    (severityFilter === 'all' || a.severity === severityFilter) &&
    (statusFilter === 'all' || a.status === statusFilter)
  );

  const COLUMNS = [
    { 
      key: 'severity', 
      header: 'Sev', 
      width: 80, 
      render: (r: Alert) => <StatusBadge severity={r.severity} /> 
    },
    { 
      key: 'category', 
      header: 'Category', 
      width: 140 
    },
    { 
      key: 'src_ip', 
      header: 'Source IP', 
      width: 130, 
      render: (r: Alert) => formatIP(r.src_ip) 
    },
    { 
      key: 'composite_score', 
      header: 'Score', 
      width: 70, 
      render: (r: Alert) => (
        <span style={{ color: r.composite_score > 0.8 ? 'var(--critical)' : 'var(--warning)', fontWeight: 600 }}>
          {(r.composite_score * 100).toFixed(0)}%
        </span>
      )
    },
    { 
      key: 'timestamp', 
      header: 'Time', 
      width: 100, 
      render: (r: Alert) => formatTime(r.timestamp) 
    },
    { 
      key: 'status', 
      header: 'Status', 
      width: 100, 
      render: (r: Alert) => (
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
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
          ALERT CONSOLE
        </h1>
      </header>

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
            data={alerts as any}
            loading={loading}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedAlert(r as Alert)}
            maxHeight="calc(100vh - 280px)"
          />
        </GlassPanel>

      <AlertDetailDrawer 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
        onUpdateStatus={updateStatus}
        onAssignToMe={(id) => assignToMe(id)}
      />
    </div>
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
