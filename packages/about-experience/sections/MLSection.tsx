'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ML Section
// Neural network visualization with model cards
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';
import { GlassCard } from '../components/GlassCard';

const models = [
  { name: 'Random Forest', accuracy: '97.2%', color: '#00ffff' },
  { name: 'XGBoost', accuracy: '96.8%', color: '#0080ff' },
  { name: 'Autoencoder', accuracy: '95.4%', color: '#9333ea' },
  { name: 'Isolation Forest', accuracy: '94.1%', color: '#ffa500' },
];

export function MLSection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/ml-models.mp4"
      posterSrc="/videos/about/poster-ml.webp"
      sectionIndex={3}
      id="ml"
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
            background: 'rgba(147, 51, 234, 0.1)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#9333ea',
            marginBottom: '1.5rem',
          }}>
            Machine Learning
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            color: '#fff',
          }}>
            Ensemble <span style={{ color: '#9333ea' }}>Intelligence</span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Four complementary ML models work in concert, combining supervised and unsupervised
            learning for comprehensive threat detection.
          </p>
        </motion.div>

        {/* Ensemble Formula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '1.5rem',
            background: 'rgba(147, 51, 234, 0.05)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
            borderRadius: '12px',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            ENSEMBLE PREDICTION
          </div>
          <div style={{ fontSize: '1.2rem', color: '#9333ea' }}>
            Σ(wᵢ × fᵢ(x)) / Σwᵢ &nbsp; where wᵢ = accuracy_weight
          </div>
        </motion.div>

        {/* Model Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
          {models.map((model, index) => (
            <GlassCard key={index} accent="purple" delay={index * 0.1}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1rem',
                  borderRadius: '12px',
                  background: `${model.color}20`,
                  border: `1px solid ${model.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  🧠
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '0.5rem',
                }}>
                  {model.name}
                </h3>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: model.color,
                  fontFamily: 'monospace',
                }}>
                  {model.accuracy}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  Accuracy
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </CinematicVideoSection>
  );
}