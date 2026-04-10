'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — TopBar
// 56px header: Logo, Threat Level badge, notifications,
// language toggle, and user menu
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Bell, Globe, Menu, X } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTranslation } from '@/hooks/useTranslation';
import { THREAT_LEVEL_COLORS, type ThreatLevel } from '@/lib/constants';

interface TopBarProps {
  onOpenSidebar?: () => void;
}

export function TopBar({ onOpenSidebar }: TopBarProps) {
  const { systemStatus, lastAlertEvent } = useWebSocket();
  const { t, locale, toggleLocale } = useTranslation();
  const [alertBadge, setAlertBadge] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Increment badge on new alert
  useEffect(() => {
    if (lastAlertEvent) {
      setAlertBadge((n) => n + 1);
    }
  }, [lastAlertEvent]);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notification-popup')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

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
            display: 'none', // Controlled by CSS media queries or className
          }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Left — Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
            THREATMATRIX
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>AI</span>
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
            THREAT LEVEL: {threatLevel}
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

          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) setAlertBadge(0); // Reset badge when opening
              }}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: alertBadge > 0 ? 'var(--critical)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                transition: 'var(--transition-fast)',
              }}
              className="nav-icon"
              title={t('TopBar.notifications')}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {alertBadge > 0 && (
                <span
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--critical)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 14, height: 14,
                    fontSize: '0.6rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-data)',
                    fontWeight: 700,
                    boxShadow: '0 0 8px var(--critical)',
                  }}
                >
                  {alertBadge > 9 ? '9+' : alertBadge}
                </span>
              )}
            </button>

            {/* Notifications Popup */}
            {showNotifications && (
              <div
                className="notification-popup"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 320,
                  maxHeight: 400,
                  background: 'rgba(17, 17, 24, 0.97)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Recent Alerts
                  </span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ padding: '8px 0', maxHeight: 320, overflowY: 'auto' }}>
                  {alertBadge === 0 ? (
                    <div
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                      }}
                    >
                      No new notifications
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                      }}
                    >
                      Notifications cleared
                    </div>
                  )}
                  {/* Could add recent alerts list here if we store them */}
                </div>
              </div>
            )}
          </div>

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
