'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ThreatLevel Gauge
// DEFCON-style threat level indicator
// ═══════════════════════════════════════════════════════

import { useMemo } from 'react';
import type { ThreatLevel as ThreatLevelType } from '@/lib/constants';
import { THREAT_LEVEL_COLORS } from '@/lib/constants';

interface ThreatLevelProps {
  level: ThreatLevelType;
  loading?: boolean;
}

export function ThreatLevel({ level, loading = false }: ThreatLevelProps) {
  const color = THREAT_LEVEL_COLORS[level];
  
  const rotation = useMemo(() => {
    switch (level) {
      case 'SAFE': return 0;
      case 'GUARDED': return 72;
      case 'ELEVATED': return 144;
      case 'HIGH': return 216;
      case 'CRITICAL': return 288;
      default: return 0;
    }
  }, [level]);

  if (loading) {
    return (
      <div className="glass-panel-static" style={{ padding: 'var(--space-3)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 'var(--space-2)',
        }}>
          <span style={{ fontSize: '1rem' }}>🛡️</span>
          <span style={{
            fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)',
            fontWeight: 600, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            THREAT LEVEL
          </span>
        </div>
        <div style={{
          height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-static" style={{ padding: 'var(--space-3)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 'var(--space-2)',
      }}>
        <span style={{ fontSize: '1rem' }}>🛡️</span>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)',
          fontWeight: 600, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          THREAT LEVEL
        </span>
      </div>
      
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'var(--space-2)',
      }}>
        {/* Gauge */}
        <div style={{
          position: 'relative', width: 100, height: 100,
        }}>
          {/* Background arc */}
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
              strokeDasharray="188.5"
              strokeDashoffset="47.1"
              transform="rotate(135 50 50)"
            />
            {/* Colored arc based on level */}
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray="188.5"
              strokeDashoffset={188.5 - (rotation / 360) * 188.5}
              transform="rotate(135 50 50)"
              style={{
                transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease-in-out',
                filter: `drop-shadow(0 0 8px ${color}40)`,
              }}
            />
          </svg>
          
          {/* Center text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: 'var(--text-lg)',
              fontWeight: 700, color: color,
              textShadow: `0 0 10px ${color}40`,
            }}>
              {level}
            </div>
          </div>
        </div>
        
        {/* Level labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', width: '100%',
          fontFamily: 'var(--font-data)', fontSize: '0.6rem',
          color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
          <span>Safe</span>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
}
