'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — CTA Section
// Pulsing CTA portal with link to /login
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';

export function CTASection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/cta-portal.mp4"
      posterSrc="/videos/about/poster-cta.webp"
      sectionIndex={7}
      id="cta"
    >
      <div style={{
        padding: '2rem',
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
      }}>
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
          Ready to Deploy
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #00ffff 50%, #0080ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Enter the Command Center
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontSize: '1.15rem',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.6,
          }}
        >
          Experience the full power of AI-driven network security.
          Monitor threats, analyze patterns, and protect your infrastructure in real-time.
        </motion.p>

        {/* CTA Button with Pulse Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          {/* Pulse rings */}
          <motion.div
            animate={{
              scale: [1, 1.5],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              inset: '-10px',
              border: '2px solid rgba(0, 255, 255, 0.5)',
              borderRadius: '16px',
            }}
          />
          <motion.div
            animate={{
              scale: [1, 1.8],
              opacity: [0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
            style={{
              position: 'absolute',
              inset: '-20px',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '16px',
            }}
          />

          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.25rem 3rem',
              background: 'linear-gradient(135deg, #00ffff, #0080ff)',
              color: '#000',
              fontWeight: 700,
              fontSize: '1.1rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              position: 'relative',
              zIndex: 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Launch Command Center
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </a>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{
            marginTop: '3rem',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace',
          }}
        >
          Free trial • No credit card required • Deploy in minutes
        </motion.p>
      </div>
    </CinematicVideoSection>
  );
}