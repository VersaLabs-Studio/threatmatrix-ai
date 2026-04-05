'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Alert Detail Page (v0.6.2)
// Standalone detail view for individual alerts
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Clock, MapPin, Zap, User, CheckCircle, AlertTriangle, Bot, Copy, ExternalLink, Activity, Network, Hash } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { formatTime, formatIP } from '@/lib/utils';
import { api } from '@/lib/api';
import type { AlertResponse } from '@/lib/types';
import type { AlertStatus } from '@/lib/constants';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;

  const [alert, setAlert] = useState<AlertResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!alertId) return;
    const fetchAlert = async () => {
      setLoading(true);
      const { data, error: err } = await api.get<AlertResponse>(`/api/v1/alerts/${alertId}`);
      if (err) {
        setError(err);
      } else if (data) {
        setAlert(data);
      }
      setLoading(false);
    };
    void fetchAlert();
  }, [alertId]);

  const handleStatusUpdate = async (newStatus: AlertStatus) => {
    if (!alert) return;
    setUpdating(true);
    const { data, error: err } = await api.patch<AlertResponse>(`/api/v1/alerts/${alert.id}/status`, {
      new_status: newStatus,
    });
    if (err) {
      setError(err);
    } else if (data) {
      setAlert(data);
    }
    setUpdating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ fontFamily: 'var(--font-data)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading alert details...
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !alert) {
    return (
      <AuthGuard>
        <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-data)', color: 'var(--critical)', fontSize: '0.85rem', marginBottom: 8 }}>
              {error || 'Alert not found'}
            </div>
            <button
              onClick={() => router.push('/alerts')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontFamily: 'var(--font-data)',
                fontSize: '0.7rem',
              }}
            >
              ← Back to Alerts
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const sourceIP = alert.source_ip ?? '';
  const destIP = alert.dest_ip ?? alert.destination_ip ?? '';
  const confidence = alert.confidence ?? 0;
  const compositeScore = alert.composite_score ?? confidence;

  return (
    <AuthGuard>
      <div style={{ padding: 'var(--space-4)', maxWidth: 1200, margin: '0 auto' }}>
        {/* Back Navigation */}
        <button
          onClick={() => router.push('/alerts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-data)',
            fontSize: '0.75rem',
            padding: '8px 0',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          Back to Alert Console
        </button>

        {/* Alert Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            padding: 'var(--space-4)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <StatusBadge severity={alert.severity} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-data)', fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {alert.title || 'Alert Detail'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  #{alert.alert_id || alert.id.slice(-8).toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Detected {formatTime(alert.created_at)}
                </span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {alert.status}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => copyToClipboard(JSON.stringify(alert, null, 2))}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Copy size={12} /> Copy JSON
            </button>
          </div>
        </div>

        {/* Core Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 24 }}>
          <MetadataCard icon={<Shield size={16} />} label="Category" value={alert.category || 'N/A'} accent="cyan" />
          <MetadataCard icon={<Zap size={16} />} label="Confidence" value={`${(confidence * 100).toFixed(1)}%`} accent={confidence > 0.8 ? 'critical' : confidence > 0.6 ? 'high' : confidence > 0.4 ? 'warning' : 'info'} />
          <MetadataCard icon={<MapPin size={16} />} label="Source IP" value={formatIP(sourceIP)} />
          <MetadataCard icon={<MapPin size={16} />} label="Target IP" value={formatIP(destIP)} />
          <MetadataCard icon={<Clock size={16} />} label="Status" value={alert.status.toUpperCase()} accent={alert.status === 'open' ? 'warning' : alert.status === 'acknowledged' ? 'cyan' : 'safe'} />
          <MetadataCard icon={<User size={16} />} label="Owner" value={alert.assigned_to ? formatIP(alert.assigned_to) : 'UNASSIGNED'} />
          <MetadataCard icon={<Activity size={16} />} label="ML Model" value={(alert.ml_model || 'N/A').toUpperCase()} />
          <MetadataCard icon={<Hash size={16} />} label="Alert ID" value={alert.alert_id || 'N/A'} />
        </div>

        {/* ML Scores Panel */}
        <GlassPanel static title="ML MODEL SCORES" icon="🧠" style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <MLScoreCard
              title="Composite Score"
              value={`${(compositeScore * 100).toFixed(1)}%`}
              accent={compositeScore > 0.8 ? 'critical' : compositeScore > 0.6 ? 'high' : compositeScore > 0.4 ? 'warning' : 'info'}
              description="Weighted ensemble score"
            />
            <MLScoreCard
              title="Isolation Forest"
              value={alert.if_score != null ? alert.if_score.toFixed(4) : 'N/A'}
              description="Unsupervised anomaly detection"
            />
            <MLScoreCard
              title="Autoencoder"
              value={alert.ae_score != null ? alert.ae_score.toFixed(4) : 'N/A'}
              description="Reconstruction error"
            />
            <MLScoreCard
              title="Random Forest"
              value={alert.rf_score != null ? `${(alert.rf_score * 100).toFixed(1)}%` : 'N/A'}
              description="Supervised classification"
            />
            <MLScoreCard
              title="Model Agreement"
              value={(alert.model_agreement || 'N/A').toUpperCase()}
              accent={alert.model_agreement === 'unanimous' ? 'safe' : alert.model_agreement === 'majority' ? 'warning' : undefined}
              description="Cross-model consensus"
            />
            <MLScoreCard
              title="Description"
              value={alert.description || 'N/A'}
              description="Alert description"
              fullWidth
            />
          </div>
        </GlassPanel>

        {/* AI Narrative */}
        <GlassPanel static title="AI ANALYST REPORT" icon="🤖" style={{ marginBottom: 24 }}>
          {alert.ai_narrative ? (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.8rem',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  background: 'rgba(0,240,255,0.02)',
                  padding: 'var(--space-5)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(0,240,255,0.1)',
                  borderLeft: '3px solid var(--cyan)',
                  maxHeight: '600px',
                  overflowY: 'auto',
                }}
                dangerouslySetInnerHTML={{
                  __html: alert.ai_narrative
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
                    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/^### (.*$)/gm, '<h3 style="color:var(--cyan);margin:1rem 0 0.5rem;font-size:0.85rem;font-weight:700;">$1</h3>')
                    .replace(/^## (.*$)/gm, '<h2 style="color:var(--cyan);margin:1.25rem 0 0.5rem;font-size:0.9rem;font-weight:700;">$1</h2>')
                    .replace(/^# (.*$)/gm, '<h1 style="color:var(--cyan);margin:1.25rem 0 0.5rem;font-size:0.95rem;font-weight:700;">$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- (.*$)/gm, '<div style="padding-left:1rem;margin:0.25rem 0;">• $1</div>')
                    .replace(/^\d+\. (.*$)/gm, '<div style="padding-left:1rem;margin:0.25rem 0;">$1</div>')
                    .replace(/\| (.*?) \| (.*?) \|/g, '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:2px 0;border-bottom:1px solid var(--border);"><span style="color:var(--text-muted)">$1</span><span>$2</span></div>')
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/\n/g, '<br/>')
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-3)' }}>
                <button
                  onClick={() => router.push(`/ai-analyst?alert_id=${alert.id}`)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--cyan)',
                    color: 'var(--bg-dark)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Bot size={14} />
                  ANALYZE WITH AI
                </button>
                <button
                  onClick={() => router.push(`/ai-analyst?alert_id=${alert.id}`)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ExternalLink size={14} />
                  OPEN IN AI ANALYST
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: 'var(--space-6)',
              }}
            >
              <Bot size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div>AI Analyst is still processing this incident.</div>
              <div style={{ marginTop: 4, fontSize: '0.7rem' }}>Full context will be available momentarily.</div>
            </div>
          )}
        </GlassPanel>

        {/* Related Flows / Evidence */}
        <GlassPanel static title="EVIDENCE & RELATED FLOWS" icon="📡" style={{ marginBottom: 24 }}>
          {alert.flow_ids && alert.flow_ids.length > 0 ? (
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                {alert.flow_ids.length} related flow(s) identified
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alert.flow_ids.slice(0, 10).map((flowId) => (
                  <div
                    key={flowId}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {flowId}
                    </span>
                    <button
                      onClick={() => router.push(`/network?flow_id=${flowId}`)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--cyan)',
                        border: '1px solid var(--border-active)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.6rem',
                      }}
                    >
                      View Flow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
              <Network size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div>No related flows linked to this alert.</div>
            </div>
          )}
        </GlassPanel>

        {/* Action Footer */}
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 'var(--space-3)',
          }}
        >
          <ActionButton
            icon={<CheckCircle size={16} />}
            label="ACKNOWLEDGE"
            onClick={() => handleStatusUpdate('acknowledged')}
            variant="cyan"
            disabled={alert.status === 'acknowledged' || updating}
          />
          <ActionButton
            icon={<AlertTriangle size={16} />}
            label="MARK FALSE POSITIVE"
            onClick={() => handleStatusUpdate('resolved')}
            variant="muted"
            disabled={updating}
          />
          <ActionButton
            icon={<User size={16} />}
            label="ASSIGN TO ME"
            onClick={() => {}}
            variant="tertiary"
            disabled={updating}
          />
        </div>
      </div>
    </AuthGuard>
  );
}

function MetadataCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', color: accent ? `var(--${accent})` : 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
        {value}
      </div>
    </div>
  );
}

function MLScoreCard({ title, value, accent, description, fullWidth }: { title: string; value: string; accent?: string; description: string; fullWidth?: boolean }) {
  return (
    <div
      style={{
        padding: 'var(--space-3)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        gridColumn: fullWidth ? 'span 3' : undefined,
      }}
    >
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '1rem', fontWeight: 700, color: accent ? `var(--${accent})` : 'var(--text-primary)', marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
        {description}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant, disabled }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: string;
  disabled?: boolean;
}) {
  const isCyan = variant === 'cyan';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-data)',
        fontSize: '0.7rem',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isCyan ? 'var(--cyan)' : variant === 'muted' ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.05)',
        color: isCyan ? 'var(--bg-dark)' : 'var(--text-primary)',
        border: variant === 'tertiary' ? '1px solid var(--border)' : 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon} {label}
    </button>
  );
}
