'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — TopBar
// Revamped header with VersaLabs branding
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Globe, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTranslation } from '@/hooks/useTranslation';
import { THREAT_LEVEL_COLORS, type ThreatLevel } from '@/lib/constants';

interface TopBarProps {
  onOpenSidebar?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopBar({ onOpenSidebar, sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const { systemStatus } = useWebSocket();
  const { t, locale, toggleLocale } = useTranslation();
  const [currentTime, setCurrentTime] = useState('');

  const threatLevel: ThreatLevel = systemStatus?.threat_level ?? 'GUARDED';

  // Live clock in TopBar
  useEffect(() => {
    const tick = () => {
      setCurrentTime(new Date().toISOString().slice(11, 19) + ' UTC');
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--space-4)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - var(--space-8))',
        maxWidth: '1400px',
        zIndex: 'var(--z-topbar)',
      }}
    >
      <header className="glass-panel glass-panel-noise" style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-6)',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Mobile Menu Trigger */}
        <button
          onClick={onOpenSidebar}
          className="nav-icon mobile-only"
          style={{
            marginRight: 'var(--space-2)',
            background: 'none',
            border: 'none',
            display: 'none',
          }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Sidebar Collapse Toggle (desktop) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'none',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 'var(--space-3)',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-active)';
              e.currentTarget.style.color = 'var(--cyan)';
              e.currentTarget.style.background = 'var(--cyan-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'none';
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Left — VersaLabs Logo + Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <div style={{
            width: 36,
            height: 36,
            position: 'relative',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <Image
              src="/versalabs-logo.png"
              alt="VersaLabs"
              fill
              style={{ objectFit: 'contain' }}
              sizes="36px"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-base)',
                fontWeight: 800,
                color: 'var(--cyan)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {t('Common.threatMatrix')}
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600, marginLeft: 'var(--space-1)' }}>{t('Common.ai')}</span>
            </span>
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 500,
              marginTop: 1,
            }}>
              Made by VersaLabs
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Center — Threat Level badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${THREAT_LEVEL_COLORS[threatLevel]}44`,
            background: `${THREAT_LEVEL_COLORS[threatLevel]}11`,
            position: 'relative',
            overflow: 'hidden',
          }}
          className="severity-badge"
        >
          <span
            style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: THREAT_LEVEL_COLORS[threatLevel],
              boxShadow: `0 0 12px ${THREAT_LEVEL_COLORS[threatLevel]}`,
              animation: threatLevel === 'CRITICAL' ? 'pulse 1s ease-in-out infinite' : undefined,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '11px',
              fontWeight: 700,
              color: THREAT_LEVEL_COLORS[threatLevel],
              letterSpacing: '0.1em',
            }}
            >
              {t('TopBar.threatLevel')}: {threatLevel}
            </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right — Clock, Language, Notifications, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* UTC Clock */}
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {currentTime}
          </span>

          {/* System Status */}
          <div
            className="btn-aether"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-pill)', gap: 8, display: 'flex', alignItems: 'center' }}
            title="System Status"
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--safe)',
              boxShadow: '0 0 8px var(--safe)',
              flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 'var(--text-xs)' }}>
              {t('TopBar.systemOperational')}
            </span>
          </div>

          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="btn-aether"
            style={{ padding: '6px 12px' }}
            title={t('TopBar.toggleLanguage')}
          >
            <Globe size={14} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{locale.toUpperCase()}</span>
          </button>

          {/* User avatar */}
          <div
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cyan-muted), transparent)',
              border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xs)',
              color: 'var(--cyan)',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
              transition: 'var(--transition-base)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="User menu"
          >
            TM
          </div>
        </div>
      </header>
    </div>
  );
}
