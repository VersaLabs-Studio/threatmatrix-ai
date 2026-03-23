'use client';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

export function EmptyState({ message, icon = '📭' }: EmptyStateProps) {
  return (
    <div style={{
      padding: 'var(--space-8)',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-data)',
      fontSize: 'var(--text-sm)',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{icon}</div>
      <p>{message}</p>
    </div>
  );
}
