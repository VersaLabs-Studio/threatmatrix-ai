'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';
import { AnimatedCounter } from '../components/AnimatedCounter';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Benchmarks Section v2
 * Scroll-pinned animated counters with particle field.
 * No video — pure CSS/Framer animation.
 * ═══════════════════════════════════════════════════════
 */

const benchmarks = [
  { value: 99.7, suffix: '%', label: 'Uptime SLA', decimals: 1, color: '#4ade80' },
  { value: 50000, suffix: '+', label: 'Events/Second', decimals: 0, color: '#00e5ff' },
  { value: 0.3, suffix: 'ms', label: 'Avg Latency', decimals: 1, color: '#3b82f6' },
  { value: 10, suffix: 'TB+', label: 'Data Processed Daily', decimals: 0, color: '#a855f7' },
  { value: 99.2, suffix: '%', label: 'Threat Detection Rate', decimals: 1, color: '#00e5ff' },
  { value: 0.1, suffix: '%', label: 'False Positive Rate', decimals: 1, color: '#22c55e' },
];

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

export function BenchmarksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { registerSection, setActiveSection } = useScrollytelling();
  const [visible, setVisible] = useState(false);

  const SECTION_INDEX = 6;

  useEffect(() => {
    registerSection(SECTION_INDEX, sectionRef.current);
    return () => registerSection(SECTION_INDEX, null);
  }, [registerSection]);

  const rawEnter = useMotionValue(0);
  const rawExit = useMotionValue(0);
  const smoothEnter = useSpring(rawEnter, { stiffness: 120, damping: 40, restDelta: 0.001 });
  const smoothExit = useSpring(rawExit, { stiffness: 120, damping: 40, restDelta: 0.001 });

  const scrimOpacity = useTransform(() => {
    const enterP = smoothEnter.get();
    const exitP = smoothExit.get();
    if (enterP < 0.999) return 1 - enterP;
    return exitP;
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          setActiveSection(SECTION_INDEX);
          setVisible(true);
        }
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
      const sH = container.offsetHeight;
      const vH = scrollParent.clientHeight;
      const range = sH - vH;
      if (range <= 0) return;
      rawEnter.set(Math.max(0, Math.min(1, (vH - relTop) / vH)));
      rawExit.set(Math.max(0, Math.min(1, (-relTop - range) / vH)));
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
      id="benchmarks"
      style={{ minHeight: '100vh', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,40,60,0.4) 0%, #000 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,229,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ position: 'relative', zIndex: 10, padding: 'clamp(2rem, 5vw, 5rem)', maxWidth: '1200px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '6px', marginBottom: '2rem' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px #00e5ff' }} />
            <span style={{ fontFamily: '"SF Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#00e5ff' }}>Performance Metrics</span>
          </div>
          <h2 style={{ fontFamily: '-apple-system, "Inter", sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, color: '#fff', marginBottom: '1rem' }}>
            PRODUCTION
            <br />
            <span style={{ background: 'linear-gradient(100deg, #00e5ff, #0080ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GRADE</span>
          </h2>
          <p style={{ fontFamily: '-apple-system, "Inter", sans-serif', fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto' }}>
            Benchmarks from real production deployments handling enterprise-scale network traffic.
          </p>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {benchmarks.map((m, i) => (
            <div
              key={m.label}
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
              }}
            >
              <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: m.color, filter: `drop-shadow(0 0 10px ${m.color}44)`, marginBottom: '0.5rem' }}>
                <AnimatedCounter target={m.value} suffix={m.suffix} decimals={m.decimals} duration={2500} />
              </div>
              <div style={{ fontFamily: '"SF Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrim */}
      <motion.div style={{ position: 'absolute', inset: 0, background: '#000', opacity: scrimOpacity, zIndex: 100, pointerEvents: 'none' }} />
    </section>
  );
}