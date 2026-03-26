'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Scroll Progress Navigation
// Fixed right-side dot navigation with active state
// ═══════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

const SECTION_LABELS = [
  'Hero',
  'Problem',
  'Architecture',
  'ML Models',
  'Competitive',
  'Tech Stack',
  'Benchmarks',
  'Get Started',
];

export function ScrollProgress() {
  const { currentSection, scrollToSection } = useScrollytelling();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav
      className="scroll-progress-nav"
      style={{
        position: 'fixed',
        right: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'flex-end',
      }}
      aria-label="Section navigation"
    >
      {SECTION_LABELS.map((label, index) => {
        const isActive = index === currentSection;
        const isHovered = index === hoveredIndex;

        return (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={`Navigate to ${label}`}
            aria-current={isActive ? 'true' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Dot */}
            <motion.div
              className={`scroll-dot ${isActive ? 'scroll-dot--active' : ''}`}
              animate={{
                scale: isActive ? 1.5 : 1,
                backgroundColor: isActive ? '#00ffff' : 'rgba(255,255,255,0.3)',
                boxShadow: isActive
                  ? '0 0 12px rgba(0,255,255,0.6), 0 0 24px rgba(0,255,255,0.3)'
                  : 'none',
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}