'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Alert Console Page (v0.6.3)
// Enterprise incident triage with expandable row details
// ═══════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Shield, Zap, MapPin, Clock, Bot, ArrowRight } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatTime, formatIP } from '@/lib/utils';
import type { AlertResponse } from '@/lib/types';
import type { Severity, AlertStatus } from '@/lib/constants';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AlertConsolePage() {
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { alerts, total, loading } = useAlerts({
    severity: severityFilter,
    status: statusFilter,
    category: categoryFilter,
    limit: 100,
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <AuthGuard>
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* ── Header ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--cyan)',
                letterSpacing: '0.12em',
                margin: 0,
              }}>
                INCIDENT ALERT CONSOLE
              </h1>
              <p style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                margin: 0,
              }}>
                Live monitoring · {total} total alerts · {alerts.length} displayed
              </p>
            </div>
          </div>
        </div>

        {/* ── Filter Toolbar ─────────────────────────── */}
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
          <FilterGroup
            label="CATEGORY"
            options={['all', 'ddos', 'port_scan', 'unauthorized_access', 'privilege_escalation', 'anomaly']}
            current={categoryFilter}
            onSelect={(v: string) => setCategoryFilter(v)}
          />
        </div>

        {/* ── Alert List ─────────────────────────────── */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 100px 140px 1fr 140px 140px 90px 120px 50px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
          }}>
            <span style={headerStyle}>#</span>
            <span style={headerStyle}>Severity</span>
            <span style={headerStyle}>Category</span>
            <span style={headerStyle}>Title</span>
            <span style={headerStyle}>Source</span>
            <span style={headerStyle}>Target</span>
            <span style={headerStyle}>Score</span>
            <span style={headerStyle}>Time</span>
            <span style={headerStyle}></span>
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: '0.8rem' }}>
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: '0.8rem' }}>
              No alerts match current filters
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                index={idx}
                isExpanded={expandedId === alert.id}
                onToggle={() => toggleExpand(alert.id)}
                onViewDetail={() => router.push(`/alerts/${alert.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

/* ── Alert Row Component ──────────────────────────────── */

function AlertRow({
  alert,
  index,
  isExpanded,
  onToggle,
  onViewDetail,
}: {
  alert: AlertResponse;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
}) {
  const conf = alert.confidence ?? 0;
  const scoreColor = conf > 0.8 ? 'var(--critical)' : conf > 0.6 ? 'var(--high)' : conf > 0.4 ? 'var(--warning)' : 'var(--info)';
  const statusColor = alert.status === 'open' ? 'var(--warning)' : alert.status === 'acknowledged' ? 'var(--cyan)' : 'var(--safe)';
  const borderColor = alert.severity === 'critical' ? 'var(--critical)' : alert.severity === 'high' ? 'var(--high)' : 'transparent';

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Main Row */}
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 100px 140px 1fr 140px 140px 90px 120px 50px',
          padding: '10px 16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: isExpanded ? 'rgba(0,240,255,0.03)' : 'transparent',
          borderLeft: `3px solid ${borderColor}`,
        }}
        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusBadge severity={alert.severity} />
        </div>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          color: 'var(--cyan)',
          letterSpacing: '0.05em',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
        }}>
          {alert.category || '—'}
        </span>
        <span style={{
          fontSize: '0.78rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {alert.title || '—'}
        </span>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <MapPin size={12} style={{ marginRight: 4, opacity: 0.5 }} />
          {formatIP(alert.source_ip || '')}
        </span>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <MapPin size={12} style={{ marginRight: 4, opacity: 0.5 }} />
          {formatIP(alert.dest_ip || alert.destination_ip || '')}
        </span>
        <span style={{
          fontFamily: 'var(--font-data)',
          color: scoreColor,
          fontWeight: 700,
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
        }}>
          {(conf * 100).toFixed(0)}%
        </span>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Clock size={12} style={{ marginRight: 4, opacity: 0.5 }} />
          {formatTime(alert.created_at)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--cyan)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            {/* Left: Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MetaRow icon={<Shield size={13} />} label="Alert ID" value={alert.alert_id || alert.id.slice(-8).toUpperCase()} />
              <MetaRow icon={<Zap size={13} />} label="ML Model" value={(alert.ml_model || 'N/A').toUpperCase()} />
              <MetaRow icon={<Clock size={13} />} label="Status" value={alert.status.toUpperCase()} valueColor={statusColor} />
              <MetaRow icon={<Bot size={13} />} label="AI Narrative" value={alert.ai_narrative ? 'Generated' : 'Pending'} valueColor={alert.ai_narrative ? 'var(--safe)' : 'var(--text-muted)'} />
            </div>

            {/* Center: AI Narrative Preview */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Bot size={13} /> AI Analyst Summary
              </div>
              {alert.ai_narrative ? (
                <div style={{
                  fontSize: '0.75rem',
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  maxHeight: 120,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div dangerouslySetInnerHTML={{
                    __html: alert.ai_narrative
                      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^- (.*$)/gm, '<div style="padding-left:0.75rem;margin:0.15rem 0;">• $1</div>')
                      .replace(/^\d+\. (.*$)/gm, '<div style="padding-left:0.75rem;margin:0.15rem 0;">$1</div>')
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>')
                      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '<span style="color:var(--cyan);font-weight:700;">$1</span> ')
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    background: 'linear-gradient(transparent, var(--bg-tertiary))',
                  }} />
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  AI narrative not yet generated for this alert.
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cyan)',
                color: 'var(--bg-dark)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-data)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              VIEW FULL DETAILS <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small Helper Components ──────────────────────────── */

function MetaRow({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 80 }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: '0.72rem',
        color: valueColor || 'var(--text-primary)',
        fontWeight: 600,
      }}>
        {value}
      </span>
    </div>
  );
}

function FilterGroup({ label, options, current, onSelect }: { label: string; options: string[]; current: string; onSelect: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}>
        {label}:
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${current === opt ? 'var(--cyan)' : 'var(--border)'}`,
              background: current === opt ? 'rgba(0,240,255,0.1)' : 'var(--bg-tertiary)',
              color: current === opt ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: current === opt ? 700 : 500,
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  fontFamily: 'var(--font-data)',
  fontSize: '0.6rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
