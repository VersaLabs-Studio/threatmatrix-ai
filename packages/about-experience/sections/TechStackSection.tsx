'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Tech Stack Section
// Hover-glow icon grid with orbit visualization
// ═══════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { CinematicVideoSection } from '../engine/CinematicVideoSection';

const technologies = [
  { name: 'Python', icon: '🐍', category: 'Backend' },
  { name: 'FastAPI', icon: '⚡', category: 'API' },
  { name: 'React', icon: '⚛️', category: 'Frontend' },
  { name: 'Next.js', icon: '▲', category: 'Framework' },
  { name: 'PostgreSQL', icon: '🐘', category: 'Database' },
  { name: 'Redis', icon: '🔴', category: 'Cache' },
  { name: 'Docker', icon: '🐳', category: 'DevOps' },
  { name: 'Scikit-learn', icon: '🤖', category: 'ML' },
  { name: 'TensorFlow', icon: '🧠', category: 'Deep Learning' },
  { name: 'PyTorch', icon: '🔥', category: 'Deep Learning' },
  { name: 'Kafka', icon: '📨', category: 'Streaming' },
  { name: 'Grafana', icon: '📊', category: 'Monitoring' },
];

export function TechStackSection() {
  return (
    <CinematicVideoSection
      videoSrc="/videos/about/tech-stack.mp4"
      posterSrc="/videos/about/poster-techstack.webp"
      sectionIndex={5}
      id="tech-stack"
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
            Technology Stack
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '1rem',
            color: '#fff',
          }}>
            Built with <span style={{ color: '#0080ff' }}>Best-in-Class</span> Tools
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            A modern, production-grade technology stack chosen for performance,
            reliability, and developer experience.
          </p>
        </motion.div>

        {/* Tech Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 30px rgba(0, 128, 255, 0.3)',
              }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                cursor: 'default',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.75rem',
              }}>
                {tech.icon}
              </div>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '0.25rem',
              }}>
                {tech.name}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                {tech.category}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </CinematicVideoSection>
  );
}