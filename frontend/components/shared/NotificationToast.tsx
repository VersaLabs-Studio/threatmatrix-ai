'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — NotificationToast
// Real-time alert notifications with severity styling
// ═══════════════════════════════════════════════════════

import { useEffect } from 'react';
import { SEVERITY_COLORS, type Severity } from '@/lib/constants';

interface Toast {
  id: string;
  severity: Severity;
  title: string;
  message: string;
}

interface NotificationToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        background: 'rgba(17, 17, 24, 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${SEVERITY_COLORS[toast.severity]}66`,
        borderLeft: `3px solid ${SEVERITY_COLORS[toast.severity]}`,
        borderRadius: 8,
        padding: '12px 16px',
        animation: 'slideInRight 0.3s ease',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: SEVERITY_COLORS[toast.severity],
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {toast.title}
        </span>
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            fontSize: '1rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </p>
    </div>
  );
}

export type { Toast };