'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Competitive Section
// CSS-fill animated progress bars comparison
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';

const advantages = [
  { label: 'Detection Accuracy', ours: 97, theirs: 72, unit: '%' },
  { label: 'False Positive Rate', ours: 2, theirs: 18, unit: '%', invert: true },
  { label: 'Response Time', ours: 0.3, theirs: 4.2, unit: 's', invert: true },
  { label: 'Models Ensemble', ours: 4, theirs: 1, unit: 'x' },
];

export function CompetitiveSection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/competitive.mp4"
      posterSrc="/videos/about/poster-competitive.webp"
      sectionIndex={4}
      id="competitive"
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
            Why ThreatMatrix
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            color: '#fff',
          }}>
            Outperforming <span style={{ color: '#00ffff' }}>Traditional Solutions</span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Side-by-side comparison showing how our ensemble approach dramatically
            outperforms single-model commercial solutions.
          </p>
        </motion.div>

        {/* Comparison Bars */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}>
          {advantages.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#fff',
                }}>
                  {item.label}
                </span>
              </div>

              {/* ThreatMatrix Bar */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#00ffff', fontFamily: 'monospace' }}>
                    THREATMATRIX AI
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#00ffff', fontWeight: 700, fontFamily: 'monospace' }}>
                    {item.ours}{item.unit}
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(0,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(item.ours / (item.invert ? Math.max(item.ours, item.theirs) : Math.max(item.ours, item.theirs))) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #00ffff, #0080ff)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              {/* Competitor Bar */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    TRADITIONAL SIEM
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontFamily: 'monospace' }}>
                    {item.theirs}{item.unit}
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(item.theirs / Math.max(item.ours, item.theirs)) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    style={{
                      height: '100%',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </CinematicVideoSection>
  );
}