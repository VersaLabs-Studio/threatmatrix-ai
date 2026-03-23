'use client';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div style={{
      padding: 'var(--space-4)',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-data)',
      fontSize: 'var(--text-xs)',
    }}>
      <span style={{ color: 'var(--critical)' }}>⚠️ {message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '4px 12px',
            border: '1px solid var(--critical)',
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            color: 'var(--critical)',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-data)',
          }}
        >
          RETRY
        </button>
      )}
    </div>
  );
}
