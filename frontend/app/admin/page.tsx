'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Administration (v0.6.0)
// System Configuration and User Management
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

import { GlassPanel } from '@/components/shared/GlassPanel';
import { Settings, Users, Database, Shield, Activity, DollarSign } from 'lucide-react';

interface AdminCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  href: string;
  status: string;
  color: string;
}

const ADMIN_CARDS: AdminCard[] = [
  { title: 'User Management', description: 'Manage users, roles, and permissions', icon: Users, href: '/admin/users', status: '4 users', color: 'var(--cyan)' },
  { title: 'System Config', description: 'Capture settings, alert thresholds, retention', icon: Settings, href: '/admin/config', status: 'Active', color: 'var(--info)' },
  { title: 'LLM Budget', description: 'Token usage, provider breakdown, budget alerts', icon: DollarSign, href: '/admin/llm-budget', status: '$42 spent', color: 'var(--safe)' },
  { title: 'Feed Management', description: 'Enable/disable feeds, sync schedules, API keys', icon: Database, href: '/admin/feeds', status: '3 feeds', color: 'var(--warning)' },
  { title: 'Capture Interfaces', description: 'Select NICs, BPF filters, capture mode', icon: Activity, href: '/admin/capture', status: 'eth0', color: 'var(--high)' },
  { title: 'Audit Log', description: 'Full system audit trail (who did what and when)', icon: Shield, href: '/admin/audit', status: '128 entries', color: 'var(--purple)' },
];

export default function AdminPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Administration
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
          System configuration and user management
        </p>
      </div>

      {/* Admin Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {ADMIN_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <GlassPanel key={card.title} style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: `${card.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={22} style={{ color: card.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    {card.description}
                  </p>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: `${card.color}15`,
                    color: card.color,
                    fontFamily: 'var(--font-data)',
                  }}>
                    {card.status}
                  </span>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
