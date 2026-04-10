'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — CriticalOverlay
// Full-screen red pulse overlay for CRITICAL alerts
// Auto-dismisses after 2 seconds
// ═══════════════════════════════════════════════════════

interface CriticalOverlayProps {
  visible: boolean;
}

export function CriticalOverlay({ visible }: CriticalOverlayProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.05) 50%, transparent 70%)',
        border: '4px solid rgba(220, 38, 38, 0.4)',
        animation: 'fadeIn 0.2s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Corner indicators */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        width: 40, height: 40, borderTop: '3px solid rgba(220, 38, 38, 0.8)', borderLeft: '3px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 40, height: 40, borderTop: '3px solid rgba(220, 38, 38, 0.8)', borderRight: '3px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite 0.2s',
      }} />
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        width: 40, height: 40, borderBottom: '3px solid rgba(220, 38, 38, 0.8)', borderLeft: '3px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite 0.4s',
      }} />
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        width: 40, height: 40, borderBottom: '3px solid rgba(220, 38, 38, 0.8)', borderRight: '3px solid rgba(220, 38, 38, 0.8)',
        animation: 'pulse 0.8s ease-in-out infinite 0.6s',
      }} />

      {/* Center label */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.2rem',
        fontWeight: 700,
        color: 'rgba(220, 38, 38, 0.9)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        animation: 'severity-breathe 1s ease-in-out infinite',
        textShadow: '0 0 20px rgba(220, 38, 38, 0.5)',
      }}>
        ⚠ CRITICAL THREAT DETECTED
      </div>
    </div>
  );
}
