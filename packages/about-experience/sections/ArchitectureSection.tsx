'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Architecture Section
// 3-layer architecture with staggered card reveal
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';
import { GlassCard } from '../components/GlassCard';

const layers = [
  {
    number: '01',
    title: 'Data Ingestion Layer',
    description: 'Real-time packet capture and flow aggregation from network interfaces using high-performance PCAP processing.',
    color: '#00ffff',
  },
  {
    number: '02',
    title: 'Processing & ML Layer',
    description: 'Feature extraction pipeline feeding into ensemble ML models for anomaly detection and threat classification.',
    color: '#0080ff',
  },
  {
    number: '03',
    title: 'Intelligence & Response',
    description: 'Automated threat correlation, IOC enrichment, and real-time alerting with actionable intelligence briefs.',
    color: '#9333ea',
  },
];

export function ArchitectureSection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/architecture.mp4"
      posterSrc="/videos/about/poster-architecture.webp"
      sectionIndex={2}
      id="architecture"
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
            background: 'rgba(0, 128, 255, 0.1)',
            border: '1px solid rgba(0, 128, 255, 0.3)',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#0080ff',
            marginBottom: '1.5rem',
          }}>
            System Architecture
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            color: '#fff',
          }}>
            Three-Layer <span style={{ color: '#00ffff' }}>Defense Stack</span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            A modular, scalable architecture designed for high-throughput network analysis
            and real-time threat detection.
          </p>
        </motion.div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {layers.map((layer, index) => (
            <GlassCard key={index} accent="cyan" delay={index * 0.15}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem',
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: layer.color,
                  opacity: 0.5,
                  lineHeight: 1,
                }}>
                  {layer.number}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '0.5rem',
                  }}>
                    {layer.title}
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {layer.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </CinematicVideoSection>
  );
}