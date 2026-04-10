'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Architecture Section v2
 *
 * "Three-Layer Defense Stack" — animated data-flow pipeline
 * Each layer reveals as the user scrolls, with animated
 * data particles flowing downward through the layers.
 *
 * No video — pure SVG + Framer Motion magic.
 * ═══════════════════════════════════════════════════════
 */

const layers = [
  {
    number: '01',
    title: 'Data Ingestion',
    subtitle: 'CAPTURE & AGGREGATE',
    description:
      'Real-time packet capture and NetFlow aggregation from network interfaces. High-performance PCAP processing at wire speed.',
    color: '#00e5ff',
    icon: 'M4 4h16v4H4zM6 12h12M8 20h8',
    nodes: ['PCAP', 'NetFlow', 'Syslog', 'DNS'],
    metrics: [
      { label: 'Throughput', value: '10 Gbps' },
      { label: 'Protocols', value: '47+' },
    ],
  },
  {
    number: '02',
    title: 'ML Processing',
    subtitle: 'DETECT & CLASSIFY',
    description:
      'Feature extraction pipeline feeds into our four-model ensemble. Consensus voting produces high-confidence threat classifications.',
    color: '#a855f7',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 6v4l3 3',
    nodes: ['Random Forest', 'XGBoost', 'Autoencoder', 'Isolation Forest'],
    metrics: [
      { label: 'Accuracy', value: '97.3%' },
      { label: 'Latency', value: '< 8ms' },
    ],
  },
  {
    number: '03',
    title: 'Intelligence & Response',
    subtitle: 'CORRELATE & ACT',
    description:
      'Automated threat correlation, IOC enrichment via OSINT feeds, and real-time alerting with actionable intelligence briefs.',
    color: '#f97316',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    nodes: ['Threat Intel', 'IOC Enrich', 'Alert Engine', 'Dashboard'],
    metrics: [
      { label: 'Response', value: '< 2s' },
      { label: 'Intel Feeds', value: '12' },
    ],
  },
];

// ── findScrollParent ──────────────────────────────────
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

export function ArchitectureSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { registerSection, setActiveSection } = useScrollytelling();
  const [activeLayer, setActiveLayer] = useState(-1);

  const SECTION_INDEX = 2;
  const SCROLL_HEIGHT_VH = 500;

  useEffect(() => {
    registerSection(SECTION_INDEX, sectionRef.current);
    return () => registerSection(SECTION_INDEX, null);
  }, [registerSection]);

  const rawProgress = useMotionValue(0);
  const rawEnter = useMotionValue(0);
  const rawExit = useMotionValue(0);

  const smoothProgress = useSpring(rawProgress, { stiffness: 60, damping: 30, restDelta: 0.001 });
  const smoothEnter = useSpring(rawEnter, { stiffness: 80, damping: 28, restDelta: 0.001 });
  const smoothExit = useSpring(rawExit, { stiffness: 80, damping: 28, restDelta: 0.001 });

  const scrimOpacity = useTransform(() => {
    const enterP = smoothEnter.get();
    const exitP = smoothExit.get();
    if (enterP < 0.999) return 1 - enterP;
    return exitP;
  });

  const contentScale = useTransform(() => {
    const enterP = smoothEnter.get();
    const exitP = smoothExit.get();
    if (enterP < 0.999) return 1.05 - (enterP * 0.05);
    return 1 - (exitP * 0.05);
  });

  // Track which layer is active based on scrollProgress
  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (v) => {
      if (v < 0.15) setActiveLayer(-1);
      else if (v < 0.4) setActiveLayer(0);
      else if (v < 0.65) setActiveLayer(1);
      else setActiveLayer(2);
    });
    return unsubscribe;
  }, [smoothProgress]);

  // IntersectionObserver
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1)
          setActiveSection(SECTION_INDEX);
      },
      { threshold: [0.1, 0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setActiveSection]);

  // Native scroll listener
  useEffect(() => {
    const container = sectionRef.current;
    if (!container) return;
    const scrollParent =
      findScrollParent(container) ??
      (typeof window !== 'undefined' ? document.documentElement : null);
    if (!scrollParent) return;

    const compute = () => {
      const cRect = container.getBoundingClientRect();
      const pRect = scrollParent.getBoundingClientRect();
      const relTop = cRect.top - pRect.top;
      const sH = container.offsetHeight;
      const vH = scrollParent.clientHeight;
      const range = sH - vH;
      if (range <= 0) return;

      const scrolled = -relTop;
      rawProgress.set(Math.max(0, Math.min(1, scrolled / range)));
      rawEnter.set(Math.max(0, Math.min(1, (vH - relTop) / vH)));
      rawExit.set(Math.max(0, Math.min(1, (-relTop - range) / vH)));
    };

    compute();
    const target = scrollParent === document.documentElement ? window : scrollParent;
    target.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute, { passive: true });
    return () => {
      target.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [rawProgress, rawEnter, rawExit]);

  return (
    <section
      ref={sectionRef}
      id="architecture"
      style={{ height: `${SCROLL_HEIGHT_VH}vh`, position: 'relative', background: '#000' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            scale: contentScale,
            transformOrigin: 'center center',
          }}
        >
          {/* Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(0,30,50,0.7) 0%, #000 70%)',
            }}
          />

          {/* Grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* ── Main Content ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(1.5rem, 4vw, 4rem)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
                gap: 'clamp(2rem, 6vw, 5rem)',
                maxWidth: '1200px',
                width: '100%',
                alignItems: 'center',
              }}
            >
              {/* ── Left: Headline ── */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.9rem',
                    background: 'rgba(0,229,255,0.08)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    borderRadius: '6px',
                    marginBottom: '2rem',
                  }}
                >
                  <div
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#00e5ff',
                      boxShadow: '0 0 8px #00e5ff',
                      animation: 'blink-dot 1.5s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"SF Mono", monospace',
                      fontSize: '0.6rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: '#00e5ff',
                    }}
                  >
                    System Architecture
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: '-apple-system, "Inter", sans-serif',
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 0.9,
                    color: '#fff',
                    marginBottom: '1.5rem',
                  }}
                >
                  THREE
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(100deg, #00e5ff, #0080ff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    LAYER
                  </span>
                  <br />
                  DEFENSE
                </h2>

                <p
                  style={{
                    fontFamily: '-apple-system, "Inter", sans-serif',
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    color: 'rgba(255,255,255,0.45)',
                    maxWidth: '320px',
                  }}
                >
                  A modular, event-driven pipeline that processes raw network traffic
                  into actionable intelligence in under 10 milliseconds.
                </p>

                {/* Active layer indicator */}
                <div
                  style={{
                    marginTop: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {layers.map((l, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        opacity: activeLayer >= i ? 1 : 0.2,
                        transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      <div
                        style={{
                          width: activeLayer === i ? '24px' : '8px',
                          height: '3px',
                          borderRadius: '2px',
                          background: activeLayer === i ? l.color : 'rgba(255,255,255,0.3)',
                          boxShadow: activeLayer === i ? `0 0 10px ${l.color}66` : 'none',
                          transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: '"SF Mono", monospace',
                          fontSize: '0.55rem',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: activeLayer === i ? l.color : 'rgba(255,255,255,0.3)',
                          transition: 'color 0.5s ease',
                        }}
                      >
                        {l.subtitle}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Pipeline Visualization ── */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                  position: 'relative',
                }}
              >
                {/* Flowing data line (vertical connector) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '32px',
                    top: '40px',
                    bottom: '40px',
                    width: '2px',
                    background: 'rgba(255,255,255,0.04)',
                    zIndex: 0,
                  }}
                >
                  {/* Animated fill */}
                  <motion.div
                    style={{
                      width: '2px',
                      background: 'linear-gradient(180deg, #00e5ff, #a855f7, #f97316)',
                      borderRadius: '1px',
                      height: useTransform(
                        smoothProgress,
                        [0, 1],
                        ['0%', '100%']
                      ),
                      boxShadow: '0 0 8px rgba(0,229,255,0.4)',
                    }}
                  />
                </div>

                {layers.map((layer, i) => {
                  const isActive = activeLayer >= i;
                  const isCurrent = activeLayer === i;

                  return (
                    <div
                      key={layer.number}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        gap: '1.5rem',
                        padding: '2rem 0',
                        opacity: isActive ? 1 : 0.12,
                        transform: isActive ? 'translateX(0)' : 'translateX(20px)',
                        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {/* Node dot */}
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          flexShrink: 0,
                          borderRadius: '16px',
                          background: `${layer.color}${isCurrent ? '18' : '08'}`,
                          border: `1px solid ${layer.color}${isCurrent ? '40' : '15'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.6s ease',
                          boxShadow: isCurrent
                            ? `0 0 30px ${layer.color}22, inset 0 0 20px ${layer.color}08`
                            : 'none',
                        }}
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={layer.color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            opacity: isCurrent ? 1 : 0.5,
                            filter: isCurrent ? `drop-shadow(0 0 6px ${layer.color}66)` : 'none',
                            transition: 'all 0.5s ease',
                          }}
                        >
                          <path d={layer.icon} />
                        </svg>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: '"SF Mono", monospace',
                            fontSize: '0.55rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: isCurrent ? layer.color : 'rgba(255,255,255,0.25)',
                            marginBottom: '0.4rem',
                            transition: 'color 0.5s ease',
                          }}
                        >
                          LAYER {layer.number} — {layer.subtitle}
                        </div>

                        <h3
                          style={{
                            fontFamily: '-apple-system, "Inter", sans-serif',
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: '0.6rem',
                          }}
                        >
                          {layer.title}
                        </h3>

                        <p
                          style={{
                            fontFamily: '-apple-system, "Inter", sans-serif',
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.45)',
                            marginBottom: '1rem',
                            maxWidth: '400px',
                          }}
                        >
                          {layer.description}
                        </p>

                        {/* Nodes */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                          {layer.nodes.map((node) => (
                            <span
                              key={node}
                              style={{
                                padding: '0.2rem 0.6rem',
                                background: `${layer.color}0A`,
                                border: `1px solid ${layer.color}20`,
                                borderRadius: '4px',
                                fontFamily: '"SF Mono", monospace',
                                fontSize: '0.55rem',
                                letterSpacing: '0.08em',
                                color: `${layer.color}AA`,
                              }}
                            >
                              {node}
                            </span>
                          ))}
                        </div>

                        {/* Metrics */}
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          {layer.metrics.map((m) => (
                            <div key={m.label}>
                              <div
                                style={{
                                  fontFamily: '"SF Mono", monospace',
                                  fontSize: '1.1rem',
                                  fontWeight: 800,
                                  color: layer.color,
                                  filter: `drop-shadow(0 0 6px ${layer.color}44)`,
                                }}
                              >
                                {m.value}
                              </div>
                              <div
                                style={{
                                  fontFamily: '"SF Mono", monospace',
                                  fontSize: '0.5rem',
                                  letterSpacing: '0.12em',
                                  textTransform: 'uppercase',
                                  color: 'rgba(255,255,255,0.25)',
                                }}
                              >
                                {m.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cinematic Scrim */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            opacity: scrimOpacity,
            zIndex: 100,
            pointerEvents: 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </section>
  );
}