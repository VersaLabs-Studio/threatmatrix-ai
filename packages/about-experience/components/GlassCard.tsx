'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Glass Card
// Glassmorphism card primitive with accent variants
// ═══════════════════════════════════════════════════════

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  accent?: 'cyan' | 'orange' | 'purple';
  className?: string;
  delay?: number;
}

const accentColors = {
  cyan: {
    border: 'rgba(0, 255, 255, 0.2)',
    glow: 'rgba(0, 255, 255, 0.1)',
    gradient: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)',
  },
  orange: {
    border: 'rgba(255, 165, 0, 0.2)',
    glow: 'rgba(255, 165, 0, 0.1)',
    gradient: 'linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(255, 100, 0, 0.05) 100%)',
  },
  purple: {
    border: 'rgba(147, 51, 234, 0.2)',
    glow: 'rgba(147, 51, 234, 0.1)',
    gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(100, 30, 180, 0.05) 100%)',
  },
};

export function GlassCard({
  children,
  accent = 'cyan',
  className = '',
  delay = 0,
}: GlassCardProps) {
  const colors = accentColors[accent];

  return (
    <motion.div
      className={`about-glass-card glass-card--${accent} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      style={{
        background: colors.gradient,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient border image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '16px',
          padding: '1px',
          background: `linear-gradient(135deg, ${colors.border}, transparent, ${colors.border})`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />

      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at center, ${colors.glow} 0%, transparent 50%)`,
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
}