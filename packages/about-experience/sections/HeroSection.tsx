'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CanvasScrubSection } from '../components/CanvasScrubSection';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Hero Section  v4 (Grade A Redesign)
 *
 * Layout philosophy:
 *  • LEFT-ALIGNED text grid — leaves the right 15% of the
 *    viewport clear for the ScrollProgress nav and avoids
 *    the "centered blob on video" anti-pattern
 *  • All text sits on a barely-visible left-edge backlight
 *    scrim — no box/card; feels native to the video
 *  • Three scroll-driven phases choreographed across 192 frames
 *
 * Frame choreography:
 *  Frame 0–19:    Pure video — breathe
 *  Frame 20–85:   PHASE 1 — System header + hero headline
 *  Frame 86–191:  PHASE 2 — Descriptor column + CTAs + metrics strip
 * ═══════════════════════════════════════════════════════
 */

const metrics = [
  { value: '99.97%', label: 'Uptime SLA', color: '#4ade80' },
  { value: '97.2%',  label: 'ML Accuracy', color: '#00e5ff' },
  { value: '<2ms',   label: 'Detect Latency', color: '#00e5ff' },
  { value: 'CRIT',   label: 'Threat Level', color: '#f87171' },
];

const capabilities = [
  'Ensemble ML — 4 models, 1 verdict',
  'Packet-level anomaly detection',
  'Live threat intelligence feeds',
  'PCAP forensics & playback',
];

export function HeroSection() {
  return (
    <CanvasScrubSection
      framesBasePath="/frames/about/hero/hero_"
      totalFrames={192}
      sectionIndex={0}
      id="hero"
      scrollMultiplier={500}
      fallbackGradient="linear-gradient(135deg, #000000 0%, #060c1a 40%, #0a1628 100%)"
      overlays={[
        /* ────────────────────────────────────────────────────
           PHASE 1  frames 20–191
           System identifier + Hero headline
           Layout: left 60% of viewport, vertically centred
        ──────────────────────────────────────────────────── */
        {
          label: 'hero-headline',
          startFrame: 20,
          endFrame: 191,
          content: (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                // Subtle left-edge scrim — keeps text readable over any video frame
                background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 55%, transparent 85%)',
                paddingLeft: 'clamp(2rem, 6vw, 5rem)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ maxWidth: '58vw' }}>

                {/* System identifier badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.75rem',
                  }}
                >
                  {/* Live pulse dot */}
                  <div style={{ position: 'relative', width: '7px', height: '7px', flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: '#00e5ff',
                      animation: 'pulse-glow 2s ease-in-out infinite',
                    }} />
                    <div style={{
                      position: 'absolute', inset: '1.5px', borderRadius: '50%',
                      background: '#00e5ff',
                    }} />
                  </div>
                  <span
                    style={{
                      fontFamily: '"SF Mono", "Fira Code", monospace',
                      fontSize: '0.68rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(0,229,255,0.75)',
                    }}
                  >
                    ThreatMatrix · System v3.0 · Active Defense
                  </span>
                </div>

                {/* Main headline — two-word split layout */}
                <div
                  style={{
                    fontFamily: '-apple-system, "SF Pro Display", "Inter", sans-serif',
                    lineHeight: 0.86,
                    letterSpacing: '-0.045em',
                    userSelect: 'none',
                  }}
                >
                  {/* THREAT line */}
                  <div
                    style={{
                      fontSize: 'clamp(3.8rem, 10.5vw, 9rem)',
                      fontWeight: 900,
                      color: '#fff',
                      display: 'block',
                      // Subtle text-shadow for depth against bright video frames
                      textShadow: '0 2px 40px rgba(0,0,0,0.6), 0 0 80px rgba(0,0,0,0.4)',
                    }}
                  >
                    THREAT
                  </div>
                  {/* MATRIX line — cyan glow */}
                  <div
                    style={{
                      fontSize: 'clamp(3.8rem, 10.5vw, 9rem)',
                      fontWeight: 900,
                      display: 'block',
                      background: 'linear-gradient(100deg, #00e5ff 0%, #2979ff 55%, #9c27b0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      // Glow punch-through so it's vivid on any video bg
                      filter: 'drop-shadow(0 0 32px rgba(0,229,255,0.5))',
                    }}
                  >
                    MATRIX
                  </div>
                  {/* AI sub-label */}
                  <div
                    style={{
                      fontSize: 'clamp(0.75rem, 2vw, 1.1rem)',
                      fontWeight: 400,
                      letterSpacing: '0.6em',
                      color: 'rgba(255,255,255,0.28)',
                      WebkitTextFillColor: 'rgba(255,255,255,0.28)',
                      display: 'block',
                      marginTop: '0.6em',
                      paddingLeft: '0.6em', // balance tracked letters
                    }}
                  >
                    INTELLIGENCE
                  </div>
                </div>
              </div>
            </div>
          ),
        },

        /* ────────────────────────────────────────────────────
           PHASE 2  frames 86–191
           Descriptor bullet list + CTAs + metrics strip
           Layout: left column, bottom-anchored
        ──────────────────────────────────────────────────── */
        {
          label: 'hero-cta',
          startFrame: 86,
          endFrame: 191,
          content: (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingLeft: 'clamp(2rem, 6vw, 5rem)',
                paddingBottom: '5.5vh',
                pointerEvents: 'none',
              }}
            >
              {/* Two-column row: capabilities list | CTAs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 'clamp(2rem, 5vw, 5rem)',
                  maxWidth: '68vw',
                  marginBottom: '2rem',
                }}
              >
                {/* ── Capabilities bullet list ── */}
                <div style={{ flex: '0 0 auto' }}>
                  <p
                    style={{
                      fontFamily: '"SF Mono", monospace',
                      fontSize: '0.6rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.35)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Core Capabilities
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {capabilities.map((cap, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          marginBottom: '0.45rem',
                        }}
                      >
                        {/* Cyan tick */}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M1.5 5.5L3.8 7.8L8.5 2.5"
                            stroke="#00e5ff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontFamily: '-apple-system, "Inter", sans-serif',
                            fontSize: 'clamp(0.75rem, 1.2vw, 0.88rem)',
                            color: 'rgba(255,255,255,0.72)',
                            lineHeight: 1.4,
                            // Hairline text-shadow for readability on bright video
                            textShadow: '0 1px 16px rgba(0,0,0,0.7)',
                          }}
                        >
                          {cap}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── CTA column ── */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    pointerEvents: 'auto',
                    flexShrink: 0,
                  }}
                >
                  {/* Primary */}
                  <motion.a
                    href="/login"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.8rem 1.8rem',
                      background: 'linear-gradient(135deg, #00e5ff 0%, #2979ff 100%)',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      letterSpacing: '0.09em',
                      textTransform: 'uppercase',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontFamily: '"SF Mono", monospace',
                      boxShadow: '0 0 24px rgba(0,229,255,0.3), 0 4px 16px rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                        animation: 'hero-shimmer 3.5s ease infinite',
                      }}
                    />
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0L7.5 4.5H12L8.5 7.3L9.8 12L6 9.3L2.2 12L3.5 7.3L0 4.5H4.5L6 0Z" />
                    </svg>
                    Initialize System
                  </motion.a>

                  {/* Ghost */}
                  <motion.a
                    href="#problem"
                    whileHover={{ borderColor: 'rgba(0,229,255,0.4)', color: '#fff' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem 1.8rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.72)',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      letterSpacing: '0.06em',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontFamily: '-apple-system, "Inter", sans-serif',
                      backdropFilter: 'blur(12px)',
                      whiteSpace: 'nowrap',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                  >
                    See the Architecture ↓
                  </motion.a>
                </div>
              </div>

              {/* ── Metrics strip — 4-cell horizontal ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: '0',
                  maxWidth: 'fit-content',
                  backdropFilter: 'blur(16px)',
                  background: 'rgba(0,0,0,0.45)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {metrics.map((m, i) => (
                  <div
                    key={m.label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.6rem 1.1rem',
                      borderRight: i < metrics.length - 1
                        ? '1px solid rgba(255,255,255,0.07)'
                        : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"SF Mono", monospace',
                        fontSize: 'clamp(0.9rem, 1.6vw, 1.1rem)',
                        fontWeight: 700,
                        color: m.color,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        filter: `drop-shadow(0 0 6px ${m.color}80)`,
                      }}
                    >
                      {m.value}
                    </span>
                    <span
                      style={{
                        fontFamily: '"SF Mono", monospace',
                        fontSize: '0.55rem',
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginTop: '3px',
                      }}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    >
      {/* Scroll indicator — bottom-centre, always visible */}
      <div
        style={{
          position: 'absolute',
          bottom: '2.2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '20px',
            height: '32px',
            border: '1.5px solid rgba(0,229,255,0.22)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px',
          }}
        >
          <motion.div
            animate={{ opacity: [0.7, 0], y: [0, 9] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeIn' }}
            style={{
              width: '3px',
              height: '5px',
              background: 'rgba(0,229,255,0.55)',
              borderRadius: '2px',
            }}
          />
        </motion.div>
        <span
          style={{
            fontFamily: '"SF Mono", monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
          }}
        >
          Scroll
        </span>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes hero-shimmer {
          0%   { transform: translateX(-120%); }
          35%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(2.5); }
        }
      `}</style>
    </CanvasScrubSection>
  );
}