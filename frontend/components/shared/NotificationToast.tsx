'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — NotificationToast (Enhanced)
// Real-time alert notifications with severity styling,
// ML model breakdown, score bar, click-to-navigate
// ═══════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldAlert, Shield, Info, Bell } from 'lucide-react';
import { SEVERITY_COLORS, type Severity } from '@/lib/constants';

interface EnhancedToast {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  alertId?: string;
  composite_score?: number;
  if_score?: number;
  ae_score?: number;
  rf_score?: number;
  model_agreement?: string;
  src_ip?: string;
  dst_ip?: string;
}

interface NotificationToastProps {
  toasts: EnhancedToast[];
  onDismiss: (id: string) => void;
}

const SEVERITY_ICONS: Record<Severity, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: ShieldAlert,
  medium: Shield,
  low: Info,
  info: Bell,
};

const SEVERITY_DURATION: Record<Severity, number> = {
  critical: 10000,
  high: 8000,
  medium: 6000,
  low: 5000,
  info: 4000,
};

export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 400,
        width: 400,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: EnhancedToast; onDismiss: (id: string) => void }) {
  const router = useRouter();
  const color = SEVERITY_COLORS[toast.severity];
  const Icon = SEVERITY_ICONS[toast.severity];
  const duration = SEVERITY_DURATION[toast.severity];
  const isCritical = toast.severity === 'critical';
  const isHigh = toast.severity === 'high';

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, duration]);

  const handleClick = () => {
    if (toast.alertId) {
      router.push(`/alerts/${toast.alertId}`);
    } else {
      router.push('/alerts');
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'rgba(17, 17, 24, 0.97)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${color}${isCritical ? '99' : '55'}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: '14px 16px',
        animation: isCritical ? 'slideInRight 0.3s ease, severity-breathe 1s ease-in-out infinite' : 'slideInRight 0.3s ease',
        boxShadow: isCritical
          ? `0 0 30px ${color}44, 0 8px 32px rgba(0, 0, 0, 0.5)`
          : isHigh
          ? `0 0 15px ${color}22, 0 4px 20px rgba(0, 0, 0, 0.4)`
          : '0 4px 20px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(-4px)';
        e.currentTarget.style.boxShadow = `0 0 40px ${color}44, 0 8px 32px rgba(0, 0, 0, 0.5)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* ── Header Row: Icon + Title + Score + Close ──── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon
          size={18}
          style={{
            color,
            filter: isCritical ? `drop-shadow(0 0 6px ${color})` : 'none',
            animation: isCritical ? 'pulse 1s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.title}
        </span>
        {toast.composite_score !== undefined && (
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.85rem',
              fontWeight: 800,
              color,
              background: `${color}18`,
              padding: '2px 8px',
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            {(toast.composite_score * 100).toFixed(0)}%
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            fontSize: '1.1rem',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* ── IP + Agreement Row ─────────────────────────── */}
      {(toast.src_ip || toast.dst_ip) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
            {toast.src_ip || '?'} → {toast.dst_ip || '?'}
          </span>
          {toast.model_agreement && (
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: '0.58rem', color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4,
            }}>
              {toast.model_agreement}
            </span>
          )}
        </div>
      )}

      {/* ── Score Bar ──────────────────────────────────── */}
      {toast.composite_score !== undefined && (
        <div style={{
          width: '100%', height: 4, background: 'rgba(255,255,255,0.08)',
          borderRadius: 2, marginBottom: 8, overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(toast.composite_score * 100, 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 2,
            transition: 'width 0.6s ease',
            boxShadow: `0 0 8px ${color}66`,
          }} />
        </div>
      )}

      {/* ── ML Model Breakdown ─────────────────────────── */}
      {(toast.if_score !== undefined || toast.ae_score !== undefined || toast.rf_score !== undefined) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          marginTop: 2,
        }}>
          <ScoreChip label="IF" value={toast.if_score} color="var(--cyan)" />
          <ScoreChip label="RF" value={toast.rf_score} color="var(--warning)" />
          <ScoreChip label="AE" value={toast.ae_score} color="var(--info)" />
        </div>
      )}

      {/* ── Click Hint ─────────────────────────────────── */}
      <div style={{
        fontFamily: 'var(--font-data)', fontSize: '0.55rem',
        color: 'var(--text-muted)', marginTop: 6, opacity: 0.6,
      }}>
        Click to view alert details →
      </div>
    </div>
  );
}

function ScoreChip({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value === undefined || value === null) return null;
  const pct = (value * 100).toFixed(0);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '3px 6px',
    }}>
      <span style={{
        fontFamily: 'var(--font-data)', fontSize: '0.55rem', fontWeight: 700,
        color, letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-data)', fontSize: '0.6rem',
        color: 'var(--text-secondary)', marginLeft: 'auto',
      }}>
        {pct}%
      </span>
    </div>
  );
}

export type { EnhancedToast as Toast };
