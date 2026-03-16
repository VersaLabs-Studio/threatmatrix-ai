'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Quick Actions
// Sidebar buttons for common analyst tasks
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  disabled?: boolean;
}

const ACTIONS = [
  { label: 'Daily Briefing',     icon: '📅', prompt: 'Give me a summary of today’s threats.' },
  { label: 'Analyze Latest',    icon: '🚨', prompt: 'Show me the latest high-severity alert and analyze it.' },
  { label: 'Network Health',    icon: '📡', prompt: 'Is there any unusual network activity lately?' },
  { label: 'Top Risks',         icon: '⚠️', prompt: 'What are the top 3 biggest risks right now?' },
  { label: 'Exec Summary',      icon: '📊', prompt: 'Generate an executive summary for the last 24 hours.' },
  { label: 'Amharic Translate', icon: '🇪🇹', prompt: 'Translate your previous analysis into Amharic.' },
];

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <GlassPanel static icon="⚡" title="QUICK ACTIONS" className="quick-actions">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            style={{
              padding: 'var(--space-2)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              opacity: disabled ? 0.5 : 1,
            }}
            className="action-button-hover"
          >
            <span style={{ fontSize: '1rem' }}>{action.icon}</span>
            <span style={{ fontWeight: 600 }}>{action.label}</span>
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}
