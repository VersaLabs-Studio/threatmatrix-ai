'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — CriticalOverlay
// Full-screen red pulse overlay for CRITICAL alerts
// Auto-dismisses after 2 seconds
// ═══════════════════════════════════════════════════════

interface CriticalOverlayProps {
  visible: boolean;
  category?: string;
  srcIp?: string;
}

export function CriticalOverlay({ visible, category, srcIp }: CriticalOverlayProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.25) 0%, rgba(220, 38, 38, 0.1) 50%, transparent 80%)',
        border: '4px solid rgba(220, 38, 38, 0.4)',
        animation: 'fadeIn 0.2s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Corner indicators */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        width: 60, height: 60, borderTop: '4px solid rgba(220, 38, 38, 0.8)', borderLeft: '4px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: 24, right: 24,
        width: 60, height: 60, borderTop: '4px solid rgba(220, 38, 38, 0.8)', borderRight: '4px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite 0.2s',
      }} />
      <div style={{
        position: 'absolute', bottom: 24, left: 24,
        width: 60, height: 60, borderBottom: '4px solid rgba(220, 38, 38, 0.8)', borderLeft: '4px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite 0.4s',
      }} />
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        width: 60, height: 60, borderBottom: '4px solid rgba(220, 38, 38, 0.8)', borderRight: '4px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite 0.6s',
      }} />

      {/* Center content */}
      <div style={{
        textAlign: 'center',
        padding: '2rem 4rem',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        boxShadow: '0 0 50px rgba(220, 38, 38, 0.4)',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 900,
          color: 'rgba(239, 68, 68, 1)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          animation: 'severity-breathe 1s ease-in-out infinite',
          textShadow: '0 0 20px rgba(220, 38, 38, 0.8)',
          marginBottom: '1rem',
        }}>
          ⚠ CRITICAL THREAT DETECTED
        </div>
        
        {category && (
          <div style={{
            fontFamily: 'var(--font-data)',
            fontSize: '1.2rem',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}>
            TYPE: <span style={{ color: 'var(--critical)' }}>{category}</span>
          </div>
        )}

        {srcIp && (
          <div style={{
            fontFamily: 'var(--font-data)',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.7)',
          }}>
            SOURCE IP: <span style={{ color: '#fff' }}>{srcIp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
