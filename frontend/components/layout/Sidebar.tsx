'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Sidebar Navigation
// Icon-only 64px sidebar with tooltip labels
// Keyboard shortcuts: Alt+1 through Alt+0
// ═══════════════════════════════════════════════════════

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Target, Search, Shield, Radio, Bot,
  Bell, FlaskConical, BrainCircuit, BarChart3, Settings,
} from 'lucide-react';
import { cx } from '@/lib/utils';

const ICON_MAP = {
  Target, Search, Shield, Radio, Bot,
  Bell, FlaskConical, BrainCircuit, BarChart3, Settings,
} as const;

const NAV_ITEMS = [
  { icon: 'Target'       as const, label: 'War Room',   href: '/war-room',   key: '1' },
  { icon: 'Search'       as const, label: 'Network',    href: '/network',    key: '2' },
  { icon: 'Shield'       as const, label: 'Intel Hub',  href: '/intel',      key: '3' },
  { icon: 'Radio'        as const, label: 'Flow Info',  href: '/network',    key: '4' },
  { icon: 'Bot'          as const, label: 'AI Analyst', href: '/ai-analyst', key: '5' },
  { icon: 'Bell'         as const, label: 'Alert Console', href: '/alerts',     key: '6' },
  { icon: 'FlaskConical' as const, label: 'Forensics Lab', href: '/forensics',  key: '7' },
  { icon: 'BrainCircuit' as const, label: 'ML Operations', href: '/ml-ops',     key: '8' },
  { icon: 'BarChart3'    as const, label: 'Reports',    href: '/reports',    key: '9' },
  { icon: 'Settings'     as const, label: 'Administration', href: '/admin',      key: '0' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  // Keyboard shortcuts: Alt+1 through Alt+0
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const item = NAV_ITEMS.find((n) => n.key === e.key);
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return (
    <nav className="sidebar">
      {/* Logo mark */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
          <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="var(--cyan)" strokeWidth="1.5" />
          <path d="M24 12L14 18V30L24 36L34 30V18L24 12Z" stroke="var(--cyan)" strokeWidth="1" fill="var(--cyan-muted)" />
          <circle cx="24" cy="24" r="3" fill="var(--cyan)" />
        </svg>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: 'var(--space-2) 0' }} />

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const Icon    = ICON_MAP[item.icon];
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

        return (
          <Link
            key={`${item.href}-${item.key}`}
            href={item.href}
            style={{ textDecoration: 'none', width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <div
              className={cx('nav-icon', isActive && 'nav-icon--active')}
              title={`${item.label} (Alt+${item.key})`}
              role="button"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
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
        v0.1.0
      </div>
    </nav>
  );
}
