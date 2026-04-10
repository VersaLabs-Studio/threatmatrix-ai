'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — CTA Section v2
 * Pulsing CTA portal — no video dependency.
 * ═══════════════════════════════════════════════════════
 */

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflow = style.overflow + style.overflowY;
    if (/auto|scroll/.test(overflow)) return current;
    current = current.parentElement;
  }
  return null;
}

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { registerSection, setActiveSection } = useScrollytelling();

  const SECTION_INDEX = 7;

  useEffect(() => {
    registerSection(SECTION_INDEX, sectionRef.current);
    return () => registerSection(SECTION_INDEX, null);
  }, [registerSection]);

  const rawEnter = useMotionValue(0);
  const smoothEnter = useSpring(rawEnter, { stiffness: 120, damping: 40, restDelta: 0.001 });

  const scrimOpacity = useTransform(() => {
    const enterP = smoothEnter.get();
    return enterP < 0.999 ? 1 - enterP : 0;
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) setActiveSection(SECTION_INDEX);
      },
      { threshold: [0.1, 0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setActiveSection]);

  useEffect(() => {
    const container = sectionRef.current;
    if (!container) return;
    const scrollParent = findScrollParent(container) ?? (typeof window !== 'undefined' ? document.documentElement : null);
    if (!scrollParent) return;
    const compute = () => {
      const cR = container.getBoundingClientRect();
      const pR = scrollParent.getBoundingClientRect();
      const relTop = cR.top - pR.top;
      const vH = scrollParent.clientHeight;
      rawEnter.set(Math.max(0, Math.min(1, (vH - relTop) / vH)));
    };
    compute();
    const target = scrollParent === document.documentElement ? window : scrollParent;
    target.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute, { passive: true });
    return () => { target.removeEventListener('scroll', compute); window.removeEventListener('resize', compute); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta"
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,60,80,0.3) 0%, #000 70%)' }} />

      <div style={{ position: 'relative', zIndex: 10, padding: '2rem', maxWidth: '900px', width: '100%', textAlign: 'center' }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: '6px',
            fontFamily: '"SF Mono", monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#00e5ff',
            marginBottom: '2rem',
          }}
        >
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          Ready to Deploy
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            fontFamily: '-apple-system, "Inter", sans-serif',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #00e5ff 50%, #0080ff 100%)',
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
            fontFamily: '-apple-system, "Inter", sans-serif',
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '520px',
            margin: '0 auto 3rem',
            lineHeight: 1.7,
          }}
        >
          Experience the full power of AI-driven network security.
          Monitor threats, analyze patterns, and protect your infrastructure in real-time.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: '-10px', border: '2px solid rgba(0,229,255,0.4)', borderRadius: '16px' }}
          />
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            style={{ position: 'absolute', inset: '-20px', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '16px' }}
          />
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.25rem 3rem',
              background: 'linear-gradient(135deg, #00e5ff, #0080ff)',
              color: '#000',
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontFamily: '"SF Mono", monospace',
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

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: '"SF Mono", monospace', letterSpacing: '0.1em' }}
        >
          Free trial • No credit card required • Deploy in minutes
        </motion.p>
      </div>

      {/* Scrim */}
      <motion.div style={{ position: 'absolute', inset: 0, background: '#000', opacity: scrimOpacity, zIndex: 100, pointerEvents: 'none' }} />
    </section>
  );
}