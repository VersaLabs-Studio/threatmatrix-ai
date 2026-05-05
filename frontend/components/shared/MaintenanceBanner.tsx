'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const STORAGE_KEY = 'tm_maint_dismissed';

export function MaintenanceBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          padding: '12px 48px 12px 24px',
          background: 'hsla(40, 92%, 56%, 0.08)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'hsla(40, 92%, 56%, 0.15)',
            border: '1px solid hsla(40, 92%, 56%, 0.3)',
            color: 'var(--warning)',
            fontSize: '14px',
            flexShrink: 0,
            animation: 'maintenance-pulse 2s ease-in-out infinite',
          }}
        >
          ⚠
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--warning)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('Maintenance.title')}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            {t('Maintenance.message')}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            pointerEvents: 'auto',
            transition: 'color var(--transition-fast)',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          aria-label={t('Maintenance.dismiss')}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, hsla(40, 92%, 56%, 0.4), transparent)',
        }}
      />
    </div>
  );
}
