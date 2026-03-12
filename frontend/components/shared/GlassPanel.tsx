// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — GlassPanel
// Primary glassmorphism container for all module panels
// ═══════════════════════════════════════════════════════

import React from 'react';
import { cx } from '@/lib/utils';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: string;
  icon?: string;
  /** Disables the hover border highlight and interactivity */
  static?: boolean;
  /** Adds the scanline animation overlay */
  scanline?: boolean;
  /** Adds noise texture */
  noise?: boolean;
  /** 3D Parallax tilt effect */
  tilt?: boolean;
  /** Rotating conic gradient border */
  refract?: boolean;
  /** Map to severity colors for spotlight and borders */
  severity?: 'critical' | 'high' | 'warning' | 'safe' | 'info';
  style?: React.CSSProperties;
}

const SEVERITY_SPOTLIGHT: Record<string, string> = {
  critical: 'hsla(0 72% 56% / 0.12)',
  high:     'hsla(25 90% 55% / 0.10)',
  warning:  'hsla(40 92% 56% / 0.08)',
  safe:     'hsla(152 60% 48% / 0.08)',
  info:     'hsla(195 85% 58% / 0.08)', // using the cyan for info
};

export function GlassPanel({
  children,
  className,
  title,
  badge,
  icon,
  static: isStatic = false,
  scanline = false,
  noise = true,
  tilt = false,
  refract = false,
  severity,
  style,
}: GlassPanelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isStatic) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);

    if (tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = ((y - centerY) / centerY) * -4;
      const tiltY = ((x - centerX) / centerX) * 4;
      containerRef.current.style.setProperty('--glass-tilt-x', `${tiltX}deg`);
      containerRef.current.style.setProperty('--glass-tilt-y', `${tiltY}deg`);
    }

    if (refract) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      containerRef.current.style.setProperty('--card-border-angle', `${angle + 90}deg`);
    }
  };

  const handleMouseLeave = () => {
    if (!containerRef.current || isStatic) return;
    if (tilt) {
      containerRef.current.style.setProperty('--glass-tilt-x', '0deg');
      containerRef.current.style.setProperty('--glass-tilt-y', '0deg');
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cx(
        isStatic ? 'glass-panel-static' : 'glass-panel',
        noise && 'glass-panel-noise',
        className,
      )}
      style={{
        ...style,
        ...(severity ? { '--spotlight-color': SEVERITY_SPOTLIGHT[severity] } as React.CSSProperties : {}),
        ...(severity === 'critical' && !isStatic ? { animation: 'severity-breathe 4s ease-in-out infinite' } : {}),
      }}
    >
      {!isStatic && <div className="spotlight" />}
      {scanline && <div className="scanline-overlay" />}

      {/* 3D Content Container */}
      <div style={{ transform: tilt && !isStatic ? 'translateZ(20px)' : 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(title || icon || badge) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
          {title && (
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                flex: 1,
              }}
            >
              {title}
            </span>
          )}
          {badge && (
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                color: 'var(--cyan)',
                background: 'var(--cyan-muted)',
                border: '1px solid var(--border-active)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                letterSpacing: '0.06em',
              }}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
      </div>
    </div>
  );
}
