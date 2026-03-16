'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Context Panel
// Displays structured context data retrieved by the AI
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';

interface ContextPanelProps {
  context: Record<string, any> | null;
}

export function ContextPanel({ context }: ContextPanelProps) {
  return (
    <GlassPanel static icon="🧠" title="INVESTIGATION CONTEXT">
      <div
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: '0.7rem',
          color: 'var(--cyan)',
          background: 'rgba(0,0,0,0.3)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          maxHeight: 300,
        }}
      >
        {!context || Object.keys(context).length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No active context. Start a chat to see analyzed entities.
          </div>
        ) : (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(context, null, 2)}
          </pre>
        )}
      </div>
      
      {context && (
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {Object.keys(context).map((key) => (
            <div
              key={key}
              style={{
                fontSize: '0.6rem',
                padding: '2px 8px',
                background: 'var(--cyan-muted)',
                color: 'var(--cyan)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--cyan)',
                fontFamily: 'var(--font-data)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {key}
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
