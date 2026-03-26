'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Hero Section
// Opening cinematic with Ken Burns zoom + scroll arrow
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';

export function HeroSection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/hero.mp4"
      posterSrc="/videos/about/poster-hero.webp"
      sectionIndex={0}
      id="hero"
    >
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '900px' }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'inline-block',
            padding: '0.5rem 1.5rem',
            background: 'rgba(0, 255, 255, 0.1)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#00ffff',
            marginBottom: '2rem',
          }}
        >
          AI-Powered Network Defense
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #00ffff 50%, #0080ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ThreatMatrix AI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.6,
          }}
        >
          Real-time network anomaly detection powered by ensemble machine learning.
          Protect your infrastructure with intelligent threat intelligence.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #00ffff, #0080ff)',
              color: '#000',
              fontWeight: 700,
              borderRadius: '12px',
              textDecoration: 'none',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Launch Command Center →
          </a>
          <a
            href="#problem"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: '12px',
              textDecoration: 'none',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              transition: 'background 0.2s',
            }}
          >
            Learn More ↓
          </a>
        </motion.div>

        {/* Scroll Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '24px',
              height: '40px',
              border: '2px solid rgba(0, 255, 255, 0.5)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '8px',
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0], y: [0, 12] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: '4px',
                height: '8px',
                background: '#00ffff',
                borderRadius: '2px',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </CinematicVideoSection>
  );
}