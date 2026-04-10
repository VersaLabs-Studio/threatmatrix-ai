'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Scroll Progress Navigation
 *
 * REDESIGN:
 *  - Replaced fat dot + tooltip layout with a minimal
 *    vertical line-segment tracker that doesn't eat into
 *    the 100vw video canvas
 *  - Component is only 28px wide total (hairline + indicator)
 *  - Label slides in from the right on hover — never wraps
 *    or pushes content left
 *  - Active segment glows cyan, inactive is 20% white
 * ═══════════════════════════════════════════════════════
 */

const SECTION_LABELS = [
  { short: '01', full: 'Hero' },
  { short: '02', full: 'Problem' },
  { short: '03', full: 'Architecture' },
  { short: '04', full: 'ML Models' },
  { short: '05', full: 'Competitive' },
  { short: '06', full: 'Tech Stack' },
  { short: '07', full: 'Benchmarks' },
  { short: '08', full: 'Get Started' },
];

export function ScrollProgress() {
  const { currentSection, scrollToSection } = useScrollytelling();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav
      aria-label="Section navigation"
      style={{
        position: 'fixed',
        right: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        // Total width is ~28px — doesn't crowd the video
      }}
    >
      {SECTION_LABELS.map(({ short, full }, index) => {
        const isActive = index === currentSection;
        const isHovered = index === hoveredIndex;

        return (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={`Navigate to ${full}`}
            aria-current={isActive ? 'true' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 0',
              outline: 'none',
            }}
          >
            {/* Label — slides out to the left on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  key="label"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"SF Mono", "Fira Code", monospace',
                      fontSize: '0.6rem',
                      letterSpacing: '0.12em',
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {short}
                  </span>
                  <span
                    style={{
                      fontFamily: '-apple-system, "Inter", sans-serif',
                      fontSize: '0.65rem',
                      letterSpacing: '0.06em',
                      color: isActive ? 'rgba(0,229,255,0.9)' : 'rgba(255,255,255,0.65)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {full}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Track segment — 2px wide hairline */}
            <motion.div
              animate={{
                height: isActive ? 28 : isHovered ? 18 : 12,
                backgroundColor: isActive
                  ? '#00e5ff'
                  : isHovered
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(255,255,255,0.2)',
                boxShadow: isActive
                  ? '0 0 8px rgba(0,229,255,0.7), 0 0 16px rgba(0,229,255,0.3)'
                  : 'none',
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: '2px',
                borderRadius: '1px',
                flexShrink: 0,
              }}
            />
          </button>
        );
      })}

      {/* Fraction indicator below the track */}
      <motion.div
        style={{
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <span
          style={{
            fontFamily: '"SF Mono", monospace',
            fontSize: '0.55rem',
            color: 'rgba(0,229,255,0.7)',
            letterSpacing: '0.05em',
          }}
        >
          {String(currentSection + 1).padStart(2, '0')}
        </span>
        <div
          style={{
            width: '1px',
            height: '12px',
            background: 'rgba(255,255,255,0.15)',
          }}
        />
        <span
          style={{
            fontFamily: '"SF Mono", monospace',
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.05em',
          }}
        >
          {String(SECTION_LABELS.length).padStart(2, '0')}
        </span>
      </motion.div>
    </nav>
  );
}