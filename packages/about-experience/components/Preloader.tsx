'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Cinematic Preloader
// Full-screen video preloader with progress bar
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_SOURCES = [
  '/videos/about/hero.mp4',
  '/videos/about/problem.mp4',
  '/videos/about/architecture.mp4',
  '/videos/about/ml-models.mp4',
  '/videos/about/competitive.mp4',
  '/videos/about/tech-stack.mp4',
  '/videos/about/cta-portal.mp4',
];

const TIMEOUT_MS = 2500;

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);

      if (mq.matches) {
        setIsVisible(false);
        return;
      }

      const loadVideos = async () => {
        const startTime = Date.now();
        let loaded = 0;

        const promises = VIDEO_SOURCES.map(async (src) => {
          try {
            await fetch(src, { method: 'HEAD', signal: AbortSignal.timeout(1000) });
          } catch {
            // Video not found
          } finally {
            loaded++;
            setProgress(Math.round((loaded / VIDEO_SOURCES.length) * 100));
          }
        });

        await Promise.race([
          Promise.all(promises),
          new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS)),
        ]);

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 800 - elapsed);
        await new Promise((resolve) => setTimeout(resolve, remaining));

        setIsVisible(false);
      };

      loadVideos();
    }
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="preloader-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            isolation: 'isolate',
          }}
        >
          <motion.div
            className="preloader-logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ marginBottom: '2rem' }}
          >
            <svg width="80" height="92" viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 0L80 23V69L40 92L0 69V23L40 0Z" fill="url(#hex-gradient)" stroke="rgba(0, 255, 255, 0.3)" strokeWidth="1" />
              <path d="M40 16L64 30V58L40 72L16 58V30L40 16Z" fill="rgba(0, 255, 255, 0.1)" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="0.5" />
              <defs>
                <linearGradient id="hex-gradient" x1="0" y1="0" x2="80" y2="92">
                  <stop offset="0%" stopColor="rgba(0, 255, 255, 0.2)" />
                  <stop offset="100%" stopColor="rgba(0, 128, 255, 0.1)" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ color: '#00ffff', fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '2rem' }}
          >
            Initializing Command Intelligence...
          </motion.h2>

          <div style={{ width: '300px', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #00ffff, #0080ff)', borderRadius: '1px' }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '1rem' }}
          >
            {progress}%
          </motion.p>

          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', pointerEvents: 'none' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}