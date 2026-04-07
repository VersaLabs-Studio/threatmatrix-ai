'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Alert Console Page (v0.6.3)
// Enterprise incident triage with expanded row details
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Zap, MapPin, Clock, Bot, ArrowRight, AlertTriangle, CheckCircle, XCircle, Eye, Search, CheckSquare, Flag, RotateCcw } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatTime, formatIP } from '@/lib/utils';
import type { AlertResponse } from '@/lib/types';
import type { Severity, AlertStatus } from '@/lib/constants';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Status transition config for list cards (compact buttons)
const STATUS_TRANSITIONS: Record<string, { status: AlertStatus; label: string; bg: string; color: string; border: string }[]> = {
  open: [
    { status: 'acknowledged', label: 'Acknowledge', bg: 'rgba(0,240,255,0.1)', color: 'var(--cyan)', border: 'var(--border-active)' },
    { status: 'investigating', label: 'Investigate', bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    { status: 'resolved', label: 'Resolve', bg: 'rgba(34,197,94,0.1)', color: 'var(--safe)', border: 'rgba(34,197,94,0.3)' },
    { status: 'false_positive', label: 'False Positive', bg: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: 'var(--border)' },
  ],
  acknowledged: [
    { status: 'investigating', label: 'Investigate', bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    { status: 'resolved', label: 'Resolve', bg: 'rgba(34,197,94,0.1)', color: 'var(--safe)', border: 'rgba(34,197,94,0.3)' },
    { status: 'false_positive', label: 'False Positive', bg: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: 'var(--border)' },
    { status: 'reopened', label: 'Reopen', bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  ],
  investigating: [
    { status: 'resolved', label: 'Resolve', bg: 'rgba(34,197,94,0.1)', color: 'var(--safe)', border: 'rgba(34,197,94,0.3)' },
    { status: 'false_positive', label: 'False Positive', bg: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: 'var(--border)' },
    { status: 'acknowledged', label: 'Back to Acknowledged', bg: 'rgba(0,240,255,0.1)', color: 'var(--cyan)', border: 'var(--border-active)' },
    { status: 'reopened', label: 'Reopen', bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  ],
  resolved: [
    { status: 'reopened', label: 'Reopen', bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  ],
  false_positive: [
    { status: 'reopened', label: 'Reopen', bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  ],
  reopened: [
    { status: 'acknowledged', label: 'Acknowledge', bg: 'rgba(0,240,255,0.1)', color: 'var(--cyan)', border: 'var(--border-active)' },
    { status: 'investigating', label: 'Investigate', bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    { status: 'resolved', label: 'Resolve', bg: 'rgba(34,197,94,0.1)', color: 'var(--safe)', border: 'rgba(34,197,94,0.3)' },
    { status: 'false_positive', label: 'False Positive', bg: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: 'var(--border)' },
  ],
};

export default function AlertConsolePage() {
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { alerts, total, loading } = useAlerts({
    severity: severityFilter,
    status: statusFilter,
    category: categoryFilter,
    limit: 100,
  });

  return (
    <AuthGuard>
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* ── Header ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={22} style={{ color: 'var(--warning)' }} />
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
            options={['all', 'open', 'acknowledged', 'investigating', 'resolved', 'false_positive', 'reopened']}
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
        {loading ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-data)',
            fontSize: '0.8rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}>
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-data)',
            fontSize: '0.8rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}>
            No alerts match current filters
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {alerts.map((alert, idx) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                index={idx}
                onViewDetail={() => router.push(`/alerts/${alert.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

/* ── Alert Card Component ─────────────────────────────── */

function AlertCard({
  alert,
  index,
  onViewDetail,
}: {
  alert: AlertResponse;
  index: number;
  onViewDetail: () => void;
}) {
  const conf = alert.confidence ?? 0;
  const scoreColor = conf > 0.8 ? 'var(--critical)' : conf > 0.6 ? 'var(--high)' : conf > 0.4 ? 'var(--warning)' : 'var(--info)';
  const statusColor = alert.status === 'open' ? 'var(--warning)' : alert.status === 'acknowledged' ? 'var(--cyan)' : 'var(--safe)';
  const borderColor = alert.severity === 'critical' ? 'var(--critical)' : alert.severity === 'high' ? 'var(--high)' : alert.severity === 'medium' ? 'var(--warning)' : 'var(--info)';
  const ifScore = alert.if_score ?? (conf > 0 ? 0 : null);
  const aeScore = alert.ae_score ?? (conf > 0 ? 1.0 : null);
  const rfScore = alert.rf_score ?? conf;
  const [updating, setUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(alert.status);

  const handleStatusUpdate = async (newStatus: AlertStatus) => {
    setUpdating(true);
    const { error: err } = await api.patch(`/api/v1/alerts/${alert.alert_id}/status`, {
      new_status: newStatus,
    });
    if (!err) {
      setLocalStatus(newStatus);
    }
    setUpdating(false);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `var(--border-active)`; e.currentTarget.style.borderLeftColor = borderColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `var(--border)`; e.currentTarget.style.borderLeftColor = borderColor; }}
    >
      {/* ── Top Row: Core Info ──────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        alignItems: 'start',
      }}>
        {/* Left: Index + Severity + Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
            }}>
              #{String(index + 1).padStart(3, '0')}
            </span>
            <StatusBadge severity={alert.severity} />
          </div>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            color: 'var(--cyan)',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}>
            {alert.category || '—'}
          </span>
        </div>

        {/* Center: Title + Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
          }}>
            {alert.title || '—'}
          </span>
          {alert.description && (
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              {alert.description}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <MapPin size={11} style={{ opacity: 0.5 }} />
              {formatIP(alert.source_ip || '')}
              <ArrowRight size={10} style={{ opacity: 0.3, margin: '0 2px' }} />
              {formatIP(alert.dest_ip || alert.destination_ip || '')}
            </span>
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Clock size={11} style={{ opacity: 0.5 }} />
              {formatTime(alert.created_at)}
            </span>
          </div>
        </div>

        {/* Right: Score + Status + Action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            color: scoreColor,
            fontWeight: 700,
            fontSize: '1.1rem',
          }}>
            {(conf * 100).toFixed(0)}%
          </span>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            color: localStatus === 'open' ? 'var(--warning)' : localStatus === 'acknowledged' ? 'var(--cyan)' : 'var(--safe)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}>
            {localStatus}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--cyan)',
              border: '1px solid var(--border-active)',
              cursor: 'pointer',
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            DETAILS <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Bottom Row: ML Scores + AI Narrative ────── */}
      <div style={{
        padding: 'var(--space-4)',
        paddingTop: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 'var(--space-4)',
      }}>
        {/* ML Scores */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-3)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Zap size={12} /> ML Scores
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MLRow label="Composite" value={conf > 0 ? `${(conf * 100).toFixed(1)}%` : 'N/A'} color={scoreColor} />
            <MLRow label="Isolation Forest" value={ifScore != null ? ifScore.toFixed(4) : 'N/A'} />
            <MLRow label="Random Forest" value={rfScore != null ? `${(rfScore * 100).toFixed(1)}%` : 'N/A'} />
            <MLRow label="Autoencoder" value={aeScore != null ? aeScore.toFixed(4) : 'N/A'} />
            <MLRow label="Model" value={(alert.ml_model || 'N/A').toUpperCase()} />
          </div>
        </div>

        {/* AI Narrative */}
        <div style={{
          gridColumn: 'span 2',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-3)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Bot size={12} /> AI Analyst Report
          </div>
          {alert.ai_narrative ? (
            <div style={{
              fontSize: '0.72rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              maxHeight: 140,
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
                height: 50,
                background: 'linear-gradient(transparent, var(--bg-tertiary))',
              }} />
            </div>
          ) : (
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              padding: 'var(--space-3) 0',
            }}>
              AI narrative not yet generated for this alert.
            </div>
          )}
        </div>
      </div>

      {/* ── Action Bar — Dynamic Based on Status ──────── */}
      {STATUS_TRANSITIONS[localStatus] && STATUS_TRANSITIONS[localStatus].length > 0 && (
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '10px var(--space-4)',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-tertiary)',
          flexWrap: 'wrap',
        }}>
          {STATUS_TRANSITIONS[localStatus].map((t) => (
            <button
              key={t.status}
              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(t.status); }}
              disabled={updating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                background: t.bg,
                color: t.color,
                border: `1px solid ${t.border}`,
                cursor: updating ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-data)',
                fontSize: '0.58rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: updating ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Small Helper Components ──────────────────────────── */

function MLRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: '0.72rem',
        color: color || 'var(--text-primary)',
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
