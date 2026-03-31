'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { api } from '@/lib/api';
import { Settings, Users, Database, Shield, Activity, DollarSign, ExternalLink } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type?: string;
  created_at: string;
}

interface LLMBudget {
  total_budget: number;
  spent: number;
  remaining: number;
  percent_used: number;
  requests_today: number;
  tokens_today: number;
}

interface SystemHealth {
  status: string;
  services: Record<string, { status: string }>;
}

interface AdminCardData {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  href: string;
  status: string;
  color: string;
  available: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [budget, setBudget] = useState<LLMBudget | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch audit log count
    const auditRes = await api.get<{ entries: AuditLogEntry[]; total: number }>('/api/v1/admin/audit-log', { limit: 1 });
    if (auditRes.data) {
      setAuditCount(auditRes.data.total ?? auditRes.data.entries?.length ?? 0);
    }

    // Fetch LLM budget
    const budgetRes = await api.get<LLMBudget>('/api/v1/llm/budget');
    if (budgetRes.data) {
      setBudget(budgetRes.data);
    }

    // Fetch system health
    const healthRes = await api.get<SystemHealth>('/api/v1/system/health');
    if (healthRes.data) {
      setHealth(healthRes.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const adminCards: AdminCardData[] = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      status: 'Available',
      color: 'var(--cyan)',
      available: false,
    },
    {
      title: 'System Config',
      description: 'Capture settings, alert thresholds, retention',
      icon: Settings,
      href: '/admin/config',
      status: health?.status ? health.status.toUpperCase() : 'UNKNOWN',
      color: health?.status === 'healthy' ? 'var(--safe)' : 'var(--warning)',
      available: false,
    },
    {
      title: 'LLM Budget',
      description: 'Token usage, provider breakdown, budget alerts',
      icon: DollarSign,
      href: '/admin/llm-budget',
      status: budget ? `$${budget.spent?.toFixed(2) ?? '0'} spent` : 'Loading...',
      color: 'var(--safe)',
      available: false,
    },
    {
      title: 'Feed Management',
      description: 'Enable/disable feeds, sync schedules, API keys',
      icon: Database,
      href: '/intel',
      status: '3 feeds active',
      color: 'var(--warning)',
      available: true,
    },
    {
      title: 'Capture Interfaces',
      description: 'Select NICs, BPF filters, capture mode',
      icon: Activity,
      href: '/admin/capture',
      status: 'eth0',
      color: 'var(--high)',
      available: false,
    },
    {
      title: 'Audit Log',
      description: 'Full system audit trail (who did what and when)',
      icon: Shield,
      href: '/admin/audit',
      status: auditCount !== null ? `${auditCount} entries` : 'Loading...',
      color: 'var(--purple)',
      available: false,
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">System configuration and user management</p>
        </div>
        <button className="btn-aether" onClick={() => void fetchData()}>
          Refresh Data
        </button>
      </div>

      {/* Admin Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <GlassPanel
              key={card.title}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                onClick={() => {
                  if (card.available) {
                    router.push(card.href);
                  }
                }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} style={{ color: card.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {card.title}
                    {card.available && <ExternalLink size={14} style={{ color: 'var(--cyan)' }} />}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    {card.description}
                  </p>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${card.color}15`,
                      color: card.color,
                      fontFamily: 'var(--font-data)',
                    }}
                  >
                    {loading ? '...' : card.status}
                  </span>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {/* System Status Summary */}
      {health && (
        <GlassPanel title="SYSTEM STATUS">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
            {Object.entries(health.services || {}).map(([name, service]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                  className="status-dot"
                  style={{
                    background: service.status === 'healthy' ? 'var(--safe)' : service.status === 'degraded' ? 'var(--warning)' : 'var(--critical)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {name}: {service.status}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
