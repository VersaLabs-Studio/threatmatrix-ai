'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Problem Section
// Globe visualization with animated stat counters
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { GlassCard } from '../components/GlassCard';

const stats = [
  { value: 4000, suffix: '+', label: 'Cyberattacks Daily', decimals: 0 },
  { value: 277, suffix: ' days', label: 'Avg Breach Detection', decimals: 0 },
  { value: 4.88, prefix: '$', suffix: 'M', label: 'Avg Breach Cost', decimals: 2 },
];

export function ProblemSection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/problem.mp4"
      posterSrc="/videos/about/poster-problem.webp"
      sectionIndex={1}
      id="problem"
    >
      <div style={{ padding: '2rem', maxWidth: '1200px', width: '100%' }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <span style={{
            display: 'inline-block',
            padding: '0.4rem 1rem',
            background: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#ffa500',
            marginBottom: '1.5rem',
          }}>
            The Threat Landscape
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            color: '#fff',
          }}>
            Cyber Threats Are <span style={{ color: '#ff4444' }}>Evolving</span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Traditional signature-based detection can't keep pace with modern attack vectors.
            Organizations need intelligent, adaptive defense systems.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {stats.map((stat, index) => (
            <GlassCard key={index} accent="orange" delay={index * 0.1}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 800,
                  color: '#ffa500',
                  fontFamily: 'monospace',
                  marginBottom: '0.5rem',
                }}>
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix || ''}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    duration={2500}
                  />
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  {stat.label}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </CinematicVideoSection>
  );
}