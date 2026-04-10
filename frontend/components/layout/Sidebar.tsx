'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Sidebar Navigation
// Icon-only 64px sidebar with tooltip labels
// Keyboard shortcuts: Alt+1 through Alt+0
// ═══════════════════════════════════════════════════════

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Target, Search, Shield, Radio, Bot, Bell, FlaskConical, BrainCircuit, BarChart3, Settings } from 'lucide-react';
import { cx } from '@/lib/utils';
import { APP_VERSION } from '@/lib/constants';
import { useAlerts } from '@/hooks/useAlerts';
import { useMLModels } from '@/hooks/useMLModels';
import { useTranslation } from '@/hooks/useTranslation';

const ICON_MAP = {
  Target, Search, Shield, Radio, Bot,
  Bell, FlaskConical, BrainCircuit, BarChart3, Settings,
} as const;


interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { alerts } = useAlerts({ limit: 100 });
  const { trainedCount } = useMLModels();
  const { t } = useTranslation();

  const navItems = [
    { icon: 'Target'       as const, label: t('Common.warRoom'),       href: '/war-room',   key: '1' },
    { icon: 'Search'       as const, label: t('Common.threatHunt'),    href: '/hunt',       key: '2' },
    { icon: 'Shield'       as const, label: t('Common.intelHub'),      href: '/intel',      key: '3' },
    { icon: 'Radio'        as const, label: t('Common.networkFlow'),   href: '/network',    key: '4' },
    { icon: 'Bot'          as const, label: t('Common.aiAnalyst'),     href: '/ai-analyst', key: '5' },
    { icon: 'Bell'         as const, label: t('Common.alertConsole'),  href: '/alerts',     key: '6' },
    { icon: 'FlaskConical' as const, label: t('Common.forensicsLab'),  href: '/forensics',  key: '7' },
    { icon: 'BrainCircuit' as const, label: t('Common.mlOps'),     href: '/ml-ops',     key: '8' },
    { icon: 'BarChart3'    as const, label: t('Common.reports'),        href: '/reports',    key: '9' },
    { icon: 'Settings'     as const, label: t('Common.admin'), href: '/admin',      key: '0' },
  ];

  // Keyboard shortcuts: Alt+1 through Alt+0
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const item = navItems.find((n) => n.key === e.key);
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, navItems]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
          }}
          className="mobile-only"
        />
      )}

      <nav className={cx('sidebar', isOpen && 'sidebar--open')}>
      {/* Logo mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', marginBottom: 'var(--space-4)' }}>
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
          <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="var(--cyan)" strokeWidth="1.5" />
          <path d="M24 12L14 18V30L24 36L34 30V18L24 12Z" stroke="var(--cyan)" strokeWidth="1" fill="var(--cyan-muted)" />
          <circle cx="24" cy="24" r="3" fill="var(--cyan)" />
        </svg>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>ThreatMatrix AI</span>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: 'var(--space-2) 0' }} />

      {/* Nav items */}
      {navItems.map((item) => {
        const Icon    = ICON_MAP[item.icon];
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        // Compute badge count for specific items
        let badgeCount = 0;
        if (item.href === '/alerts') {
          badgeCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
        } else if (item.href === '/ml-ops') {
          badgeCount = trainedCount;
        }

        return (
          <Link 
            key={item.href} 
            href={item.href} 
            onClick={onClose}
            style={{ textDecoration: 'none', width: '100%', display: 'flex', padding: '0 var(--space-3)', position: 'relative' }}
          >
            <div
              className={cx('nav-icon', isActive && 'nav-icon--active')}
              title={`${item.label} (Alt+${item.key})`}
              role="button"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
              <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              {badgeCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: item.href === '/alerts' ? 'var(--critical)' : 'var(--safe)',
                  color: 'white',
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-data)',
                }}>
                  {badgeCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}

      {/* Spacer pushes version to bottom */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
          paddingBottom: 'var(--space-4)',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}
      >
        {APP_VERSION}
      </div>
    </nav>
    </>
  );
}
