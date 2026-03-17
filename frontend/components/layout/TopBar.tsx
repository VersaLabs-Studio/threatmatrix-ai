'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — TopBar
// 56px header: Logo, Threat Level badge, notifications,
// language toggle, and user menu
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Bell, Globe } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { THREAT_LEVEL_COLORS, type ThreatLevel } from '@/lib/constants';

import { useRouter, usePathname } from 'next/navigation';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const { systemStatus, lastAlertEvent } = useWebSocket();
  const [alertBadge, setAlertBadge] = useState(0);
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

  // Increment badge on new alert
  useEffect(() => {
    if (lastAlertEvent) {
      // Use requestAnimationFrame to avoid synchronous cascading render warning
      const handle = requestAnimationFrame(() => {
        setAlertBadge((n) => n + 1);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [lastAlertEvent]);

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
  
          {/* Right — Clock, Notifications, User */}
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
  
            {/* LLM Token Budget */}
            <div
              className="btn-aether"
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-pill)', gap: 8 }}
              title="LLM Budget"
            >
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>$142.38</span>
              <span style={{ opacity: 0.5 }}>/ $250</span>
            </div>
  
            {/* Notification bell */}
            <button
              onClick={() => setAlertBadge(0)}
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
              title="Notifications"
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
