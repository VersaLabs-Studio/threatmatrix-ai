'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CanvasScrubSection } from '../components/CanvasScrubSection';
import { AnimatedCounter } from '../components/AnimatedCounter';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Problem Section  v2 (Canvas Engine)
 * 192 frames @ 24fps extracted from problem.mp4
 *
 * Frame choreography:
 *  Frame 0–19   : Video breathes — pure cinematic
 *  Frame 20–85  : Section label + headline reveal
 *  Frame 86–140 : Stat cards materialise
 *  Frame 141–191: Body copy + threat timeline
 * ═══════════════════════════════════════════════════════
 */

const stats = [
  {
    value: 4000,
    suffix: '+',
    label: 'Cyberattacks',
    sublabel: 'per day globally',
    color: '#f97316',
    icon: '⚡',
  },
  {
    value: 277,
    suffix: 'd',
    label: 'Mean Breach',
    sublabel: 'detection window',
    color: '#ef4444',
    icon: '⏱',
  },
  {
    prefix: '$',
    value: 4.88,
    suffix: 'M',
    label: 'Average Cost',
    sublabel: 'per data breach',
    color: '#fb923c',
    icon: '💀',
    decimals: 2,
  },
];

const threatTypes = [
  { name: 'Zero-Day Exploits',    pct: 94, color: '#ef4444' },
  { name: 'Ransomware',           pct: 87, color: '#f97316' },
  { name: 'Lateral Movement',     pct: 76, color: '#fb923c' },
  { name: 'Data Exfiltration',    pct: 68, color: '#fbbf24' },
];

// Full-viewport absolute shell for overlays
const Shell = ({
  children,
  justify = 'center',
  align = 'center',
}: {
  children: React.ReactNode;
  justify?: React.CSSProperties['justifyContent'];
  align?: React.CSSProperties['alignItems'];
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: justify,
      alignItems: align,
      // Left-edge scrim — keeps text legible over any video frame
      background:
        'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 55%, transparent 82%)',
      paddingLeft: 'clamp(2rem, 6vw, 5rem)',
      paddingRight: '5rem',
      paddingBottom: '0',
      pointerEvents: 'none',
    }}
  >
    {children}
  </div>
);

export function ProblemSection() {
  return (
    <CanvasScrubSection
      framesBasePath="/frames/about/problem/problem_"
      totalFrames={192}
      sectionIndex={1}
      id="problem"
      scrollMultiplier={500}
      fallbackGradient="linear-gradient(135deg, #0d0700 0%, #1a0800 50%, #0f0300 100%)"
      overlays={[
        /* ────────────────────────────────────────────────────
           PHASE 1  frames 20–191
           Section label + two-line headline
        ──────────────────────────────────────────────────── */
        {
          label: 'problem-headline',
          startFrame: 20,
          endFrame: 191,
          content: (
            <Shell justify="center" align="flex-start">
              <div style={{ maxWidth: '54vw' }}>
                {/* Threat level badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.9rem',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '4px',
                    marginBottom: '1.75rem',
                  }}
                >
                  {/* Blinking warning dot */}
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'blink-dot 1.2s ease-in-out infinite',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"SF Mono", monospace',
                      fontSize: '0.65rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: '#ef4444',
                    }}
                  >
                    Global Threat Landscape
                  </span>
                </div>

                {/* Headline */}
                <div
                  style={{
                    fontFamily: '-apple-system, "Inter", sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.88,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(3.2rem, 9vw, 7.5rem)',
                      color: '#fff',
                      display: 'block',
                      textShadow: '0 2px 40px rgba(0,0,0,0.7)',
                    }}
                  >
                    THREATS
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(3.2rem, 9vw, 7.5rem)',
                      display: 'block',
                      background:
                        'linear-gradient(100deg, #f97316 0%, #ef4444 50%, #dc2626 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 28px rgba(239,68,68,0.5))',
                    }}
                  >
                    EVOLVE
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(0.7rem, 1.8vw, 1rem)',
                      letterSpacing: '0.5em',
                      color: 'rgba(255,255,255,0.25)',
                      WebkitTextFillColor: 'rgba(255,255,255,0.25)',
                      display: 'block',
                      marginTop: '0.65em',
                      paddingLeft: '0.5em',
                    }}
                  >
                    FASTER THAN DEFENSES
                  </span>
                </div>
              </div>
            </Shell>
          ),
        },

        /* ────────────────────────────────────────────────────
           PHASE 2  frames 86–191
           Three stat cards
        ──────────────────────────────────────────────────── */
        {
          label: 'problem-stats',
          startFrame: 86,
          endFrame: 191,
          content: (
            <Shell justify="flex-end" align="flex-start">
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '2.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1rem 1.25rem',
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${stat.color}22`,
                      borderTop: `2px solid ${stat.color}`,
                      borderRadius: '8px',
                      minWidth: '130px',
                      gap: '0.2rem',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', marginBottom: '0.1rem' }}>
                      {stat.icon}
                    </span>
                    <div
                      style={{
                        fontFamily: '"SF Mono", monospace',
                        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                        fontWeight: 800,
                        color: stat.color,
                        lineHeight: 1,
                        filter: `drop-shadow(0 0 10px ${stat.color}55)`,
                      }}
                    >
                      <AnimatedCounter
                        target={stat.value}
                        prefix={stat.prefix ?? ''}
                        suffix={stat.suffix}
                        decimals={stat.decimals ?? 0}
                        duration={2000}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: '-apple-system, "Inter", sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.85)',
                        marginTop: '0.3rem',
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontFamily: '"SF Mono", monospace',
                        fontSize: '0.55rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.28)',
                      }}
                    >
                      {stat.sublabel}
                    </div>
                  </div>
                ))}
              </div>
            </Shell>
          ),
        },

        /* ────────────────────────────────────────────────────
           PHASE 3  frames 141–191
           Attack surface threat bars + closing copy
        ──────────────────────────────────────────────────── */
        {
          label: 'problem-threats',
          startFrame: 141,
          endFrame: 191,
          content: (
            <div
              style={{
                position: 'absolute',
                right: 'clamp(2rem, 5vw, 4rem)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '220px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '1.25rem',
                pointerEvents: 'none',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'blink-dot 1.2s ease-in-out infinite',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: '0.58rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  Attack Surface
                </span>
              </div>

              {/* Threat bars */}
              {threatTypes.map((t) => (
                <div key={t.name} style={{ marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '-apple-system, "Inter", sans-serif',
                        fontSize: '0.68rem',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontFamily: '"SF Mono", monospace',
                        fontSize: '0.62rem',
                        color: t.color,
                      }}
                    >
                      {t.pct}%
                    </span>
                  </div>
                  {/* Track */}
                  <div
                    style={{
                      width: '100%',
                      height: '3px',
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.pct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${t.color}99, ${t.color})`,
                        borderRadius: '2px',
                        boxShadow: `0 0 6px ${t.color}66`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Footer note */}
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: '"SF Mono", monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.2)',
                  textTransform: 'uppercase',
                }}
              >
                Avg YoY increase: +38%
              </div>
            </div>
          ),
        },
      ]}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </CanvasScrubSection>
  );
}