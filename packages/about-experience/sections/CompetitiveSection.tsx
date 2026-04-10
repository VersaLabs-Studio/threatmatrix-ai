'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CanvasScrubSection } from '../components/CanvasScrubSection';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Competitive Section v2
 * High-performance CanvasScrub engine with cinematic overlays.
 * 192 frames @ 24fps extracted from competitive.mp4
 *
 * Frame choreography:
 *  Frame 0–19   : Video breathes
 *  Frame 20–85  : Phase 1 — Headline & Subtitle reveal
 *  Frame 86–191 : Phase 2 — Comparison bars (Ours vs Theirs)
 * ═══════════════════════════════════════════════════════
 */

const advantages = [
  { label: 'Detection Accuracy', ours: 97, theirs: 72, unit: '%' },
  { label: 'False Positives',    ours: 2,  theirs: 18, unit: '%', invert: true },
  { label: 'Response Time',      ours: 0.3,theirs: 4.2,unit: 's', invert: true },
  { label: 'ML Models Ensemble', ours: 4,  theirs: 1,  unit: 'x' },
];

// Reusable Shell for left-aligned, gradient background text
const Shell = ({
  children,
  justify = 'center',
}: {
  children: React.ReactNode;
  justify?: React.CSSProperties['justifyContent'];
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: justify,
      background:
        'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 55%, transparent 85%)',
      paddingLeft: 'clamp(2rem, 6vw, 5rem)',
      paddingRight: '5rem',
      paddingBottom: '5vh',
      pointerEvents: 'none',
    }}
  >
    {children}
  </div>
);

export function CompetitiveSection() {
  return (
    <CanvasScrubSection
      framesBasePath="/frames/about/competitive/competitive_"
      totalFrames={192}
      sectionIndex={4}
      id="competitive"
      scrollMultiplier={500}
      fallbackGradient="linear-gradient(135deg, #000c14 0%, #001f33 50%, #000a12 100%)"
      overlays={[
        /* ────────────────────────────────────────────────────
           PHASE 1  frames 20–191
           Section label + Top headline
        ──────────────────────────────────────────────────── */
        {
          label: 'competitive-headline',
          startFrame: 20,
          endFrame: 191,
          content: (
            <Shell justify="flex-start">
              <div style={{ maxWidth: '58vw', marginTop: '15vh' }}>
                {/* Competitive Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.4rem 1.1rem',
                    background: 'rgba(0,128,255,0.12)',
                    border: '1px solid rgba(0,128,255,0.3)',
                    borderRadius: '6px',
                    marginBottom: '2rem',
                    boxShadow: '0 0 15px rgba(0,128,255,0.15)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"SF Mono", monospace',
                      fontSize: '0.65rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: '#0080ff',
                    }}
                  >
                    Competitive Baseline
                  </span>
                </div>

                {/* Main Headline */}
                <div
                  style={{
                    fontFamily: '-apple-system, "Inter", sans-serif',
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(3rem, 7vw, 6rem)',
                      fontWeight: 900,
                      color: '#fff',
                      display: 'block',
                      textShadow: '0 2px 30px rgba(0,0,0,0.8)',
                    }}
                  >
                    OUTPERFORMING
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(3rem, 7vw, 6rem)',
                      fontWeight: 900,
                      display: 'block',
                      background: 'linear-gradient(100deg, #00e5ff 0%, #0080ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 24px rgba(0,128,255,0.4))',
                    }}
                  >
                    TRADITIONAL SIEM
                  </span>
                </div>
                
                {/* Subtitle */}
                <p
                  style={{
                    fontFamily: '-apple-system, "Inter", sans-serif',
                    fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.6,
                    maxWidth: '480px',
                    textShadow: '0 1px 12px rgba(0,0,0,0.8)',
                  }}
                >
                  A side-by-side performance analysis. Our ensemble approach 
                  leaves single-model commercial solutions in the dust.
                </p>
              </div>
            </Shell>
          ),
        },

        /* ────────────────────────────────────────────────────
           PHASE 2  frames 86–191
           Comparison bars - Sleek Right-Anchored Panel
        ──────────────────────────────────────────────────── */
        {
          label: 'competitive-comparison',
          startFrame: 86,
          endFrame: 191,
          content: (
            <div
              style={{
                position: 'absolute',
                right: 'clamp(2rem, 6vw, 8vw)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '320px',
                background: 'linear-gradient(155deg, rgba(10,18,30,0.55) 0%, rgba(0,5,10,0.7) 100%)',
                backdropFilter: 'blur(24px) saturate(1.2)',
                border: '1px solid rgba(0,229,255,0.08)',
                borderTop: '1px solid rgba(0,229,255,0.25)',
                boxShadow: '0 24px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '1.75rem',
                pointerEvents: 'none',
              }}
            >
              {/* Header inside panel */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#00e5ff',
                    boxShadow: '0 0 10px #00e5ff',
                    animation: 'blink-dot 1.5s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Capability Gap
                </span>
              </div>

              {/* Data Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {advantages.map((item, index) => (
                  <div key={item.label}>
                    <div
                      style={{
                        fontFamily: '-apple-system, "Inter", sans-serif',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.95)',
                        marginBottom: '0.75rem',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.label}
                    </div>

                    {/* ThreatMatrix AI Row */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.55rem',
                          color: '#00e5ff',
                          fontFamily: '"SF Mono", monospace',
                          width: '45px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        TMAI
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          background: 'rgba(0,229,255,0.08)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.ours / Math.max(item.ours, item.theirs)) * 100}%` }}
                          transition={{ duration: 1, delay: 0.1 + index * 0.1, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, rgba(0,128,255,0.8) 0%, #00e5ff 100%)',
                            borderRadius: '2px',
                            boxShadow: '0 0 6px rgba(0,229,255,0.4)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#00e5ff',
                          fontWeight: 700,
                          fontFamily: '"SF Mono", monospace',
                          width: '35px',
                          textAlign: 'right',
                        }}
                      >
                        {item.ours}{item.unit}
                      </span>
                    </div>

                    {/* Traditional SIEM Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.55rem',
                          color: 'rgba(255,255,255,0.3)',
                          fontFamily: '"SF Mono", monospace',
                          width: '45px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        SIEM
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.theirs / Math.max(item.ours, item.theirs)) * 100}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'rgba(255,255,255,0.4)',
                          fontWeight: 600,
                          fontFamily: '"SF Mono", monospace',
                          width: '35px',
                          textAlign: 'right',
                        }}
                      >
                        {item.theirs}{item.unit}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    >
      <style>{`
        @keyframes blink-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.85); }
        }
      `}</style>
    </CanvasScrubSection>
  );
}