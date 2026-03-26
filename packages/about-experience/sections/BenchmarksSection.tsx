'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Benchmarks Section
// CSS particle background + animated counters
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { GlassCard } from '../components/GlassCard';

const benchmarks = [
  { value: 99.7, suffix: '%', label: 'Uptime SLA', decimals: 1 },
  { value: 50000, suffix: '+', label: 'Events/Second', decimals: 0 },
  { value: 0.3, suffix: 'ms', label: 'Avg Latency', decimals: 1 },
  { value: 10, suffix: 'TB+', label: 'Data Processed Daily', decimals: 0 },
  { value: 99.2, suffix: '%', label: 'Threat Detection Rate', decimals: 1 },
  { value: 0.1, suffix: '%', label: 'False Positive Rate', decimals: 1 },
];

export function BenchmarksSection() {
  return (
    <CinematicVideoSection
      sectionIndex={6}
      id="benchmarks"
    >
      <div style={{ padding: '2rem', maxWidth: '1200px', width: '100%' }}>
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
            background: 'rgba(0, 255, 255, 0.1)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#00ffff',
            marginBottom: '1.5rem',
          }}>
            Performance Metrics
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            color: '#fff',
          }}>
            Production-Grade <span style={{ color: '#00ffff' }}>Performance</span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Benchmarks from real production deployments handling enterprise-scale
            network traffic with mission-critical reliability.
          </p>
        </motion.div>

        {/* Benchmarks Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {benchmarks.map((metric, index) => (
            <GlassCard key={index} accent="cyan" delay={index * 0.1}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                  fontWeight: 800,
                  color: '#00ffff',
                  fontFamily: 'monospace',
                  marginBottom: '0.5rem',
                }}>
                  <AnimatedCounter
                    target={metric.value}
                    suffix={metric.suffix}
                    decimals={metric.decimals}
                    duration={2500}
                  />
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  {metric.label}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* CSS Particle Background Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: ['0vh', '100vh'],
                x: [0, Math.sin(i) * 50],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.5,
              }}
              style={{
                position: 'absolute',
                left: `${(i / 20) * 100}%`,
                top: '-20px',
                width: '2px',
                height: '2px',
                background: '#00ffff',
                borderRadius: '50%',
                opacity: 0.3,
                boxShadow: '0 0 6px rgba(0, 255, 255, 0.5)',
              }}
            />
          ))}
        </div>
      </div>
    </CinematicVideoSection>
  );
}