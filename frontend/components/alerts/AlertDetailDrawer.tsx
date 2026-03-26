'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AlertDetailDrawer
// Side-drawer for viewing and acting on a specific alert
// ═══════════════════════════════════════════════════════

import { X, Shield, Clock, MapPin, Zap, User, CheckCircle, AlertTriangle, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AlertResponse } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatTime, formatIP } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/GlassPanel';

interface AlertDetailDrawerProps {
  alert: AlertResponse | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: any) => void;
}

export function AlertDetailDrawer({ alert, onClose, onUpdateStatus }: AlertDetailDrawerProps) {
  const router = useRouter();
  if (!alert) return null;

  // Ensure IP values are strings for formatIP
  const sourceIP: string = alert.source_ip ?? '';
  const destIP: string = alert.dest_ip ?? '';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 480,
        height: '100vh',
        background: 'rgba(5, 7, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-active)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge severity={alert.severity} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>
              ALERT ID: #{alert.id.slice(-8).toUpperCase()}
            </h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Detected at {formatTime(alert.timestamp || alert.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        
        {/* Core Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <DetailItem icon={<Shield size={14} />} label="Category" value={alert.category || 'N/A'} />
          <DetailItem icon={<Zap size={14} />} label="ML Score" value={`${((alert.composite_score || 0) * 100).toFixed(1)}%`} accent="warning" />
          <DetailItem icon={<MapPin size={14} />} label="Source IP" value={formatIP(sourceIP)} />
          <DetailItem icon={<MapPin size={14} />} label="Target IP" value={formatIP(destIP)} />
          <DetailItem icon={<Clock size={14} />} label="Status" value={alert.status.toUpperCase()} />
          <DetailItem icon={<User size={14} />} label="Owner" value={alert.assigned_to || 'UNASSIGNED'} />
        </div>

        {/* ML Scores Panel */}
        <GlassPanel static title="ML SCORES" icon="🧠">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <ScoreItem label="Composite" value={`${((alert.composite_score || 0) * 100).toFixed(1)}%`} accent="cyan" />
            <ScoreItem label="IF Score" value={alert.if_score?.toFixed(3) || 'N/A'} />
            <ScoreItem label="RF Label" value={alert.rf_label?.toUpperCase() || 'N/A'} />
            <ScoreItem label="RF Confidence" value={`${((alert.rf_confidence || 0) * 100).toFixed(1)}%`} />
            <ScoreItem label="AE Score" value={alert.ae_score?.toFixed(3) || 'N/A'} />
            <ScoreItem label="Agreement" value={alert.model_agreement?.toUpperCase() || 'N/A'} accent={
              alert.model_agreement === 'unanimous' ? 'safe' :
              alert.model_agreement === 'majority' ? 'warning' : undefined
            } />
          </div>
        </GlassPanel>

        {/* AI Narrative */}
        <GlassPanel static title="AI ANALYST REPORT" icon="🤖">
          {alert.ai_narrative ? (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.8rem',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  background: 'rgba(0,240,255,0.03)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(0,240,255,0.15)',
                  borderLeft: '3px solid var(--cyan)',
                }}
                dangerouslySetInnerHTML={{ 
                  __html: alert.ai_narrative
                    .replace(/^### (.*$)/gm, '<h3 style="color:var(--cyan);margin:0.75rem 0 0.5rem;font-size:0.85rem;">$1</h3>')
                    .replace(/^## (.*$)/gm, '<h2 style="color:var(--cyan);margin:1rem 0 0.5rem;font-size:0.9rem;">$1</h2>')
                    .replace(/^# (.*$)/gm, '<h1 style="color:var(--cyan);margin:1rem 0 0.5rem;font-size:0.95rem;">$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- (.*$)/gm, '<div style="padding-left:1rem;margin:0.25rem 0;">• $1</div>')
                    .replace(/^\d+\. (.*$)/gm, '<div style="padding-left:1rem;margin:0.25rem 0;">$1</div>')
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/\n/g, '<br/>')
                }}
              />
              <button
                onClick={() => router.push(`/ai-analyst?alert_id=${alert.id}`)}
                style={{
                  marginTop: 'var(--space-3)',
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
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: 'var(--space-4)',
              }}
            >
              <Bot size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div>AI Analyst is still processing this incident.</div>
              <div style={{ marginTop: 4, fontSize: '0.7rem' }}>Full context will be available momentarily.</div>
            </div>
          )}
        </GlassPanel>

        {/* Related Flows Mock */}
        <GlassPanel static title="EVIDENCE (RELATED FLOWS)" icon="📡">
           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>
              Total related flows identified: <strong>{alert.flow_count}</strong>
              <div style={{ marginTop: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                 <div style={{ padding: 6, borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', opacity: 0.6 }}>
                    <span>Proto</span><span>Port</span><span>Bytes</span>
                 </div>
                 <div style={{ padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <span>TCP</span><span>443</span><span>248KB</span>
                 </div>
                 <div style={{ padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '0.5px solid var(--border)' }}>
                    <span>TCP</span><span>443</span><span>81.2MB</span>
                 </div>
              </div>
           </div>
        </GlassPanel>
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-3)',
          background: 'var(--bg-secondary)',
        }}
      >
        <ActionButton 
          icon={<CheckCircle size={16} />} 
          label="ACKNOWLEDGE" 
          onClick={() => onUpdateStatus(alert.id, 'acknowledged')}
          variant="cyan"
          disabled={alert.status === 'acknowledged'}
        />
        <ActionButton 
          icon={<AlertTriangle size={16} />} 
          label="MARK FALSE POSITIVE" 
          onClick={() => onUpdateStatus(alert.id, 'resolved')} 
          variant="muted"
        />
        <ActionButton 
          icon={<User size={16} />} 
          label="ASSIGN TO ME" 
          onClick={() => {}} 
          variant="tertiary"
          style={{ gridColumn: 'span 2' }}
        />
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, accent }: { icon: React.ReactNode, label: string, value: string, accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: accent ? `var(--${accent})` : 'var(--text-primary)', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

function ScoreItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.8rem', fontWeight: 700, color: accent ? `var(--${accent})` : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant, disabled, style }: any) {
  const isCyan = variant === 'cyan';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px',
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
