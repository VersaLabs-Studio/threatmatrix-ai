'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — Tech Stack Section v2
 *
 * Pinned Horizontal Scroll Gallery — pure Framer Motion
 * No GSAP dependency. Uses the same findScrollParent()
 * pattern as CanvasScrollEngine to work inside the fixed
 * layout container.
 *
 * Scroll Choreography:
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Enter:  fade in from black + scale-up              │
 *  │  Pinned: horizontal track slides left               │
 *  │          5 cards snap through the viewport           │
 *  │  Exit:   fade to black + scale-down                 │
 *  └──────────────────────────────────────────────────────┘
 *
 * Each card features:
 *  - Animated SVG icon (no emojis)
 *  - Gradient glow halo
 *  - Monospace metadata
 *  - Staggered entry micro-animations
 * ═══════════════════════════════════════════════════════
 */

// ── Tech Stack Data ─────────────────────────────────────
interface TechCard {
  name: string;
  category: string;
  description: string;
  version: string;
  color: string;       // accent color
  icon: string;        // SVG path data
  metrics: { label: string; value: string }[];
}

const techCards: TechCard[] = [
  {
    name: 'Python + FastAPI',
    category: 'Backend Core',
    description:
      'High-performance async API layer powering all ML inference endpoints, WebSocket streams, and PCAP ingestion. Sub-millisecond routing with Uvicorn.',
    version: '3.12 / 0.115',
    color: '#3b82f6',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    metrics: [
      { label: 'Throughput', value: '12k req/s' },
      { label: 'Latency P99', value: '< 2ms' },
      { label: 'Uptime', value: '99.97%' },
    ],
  },
  {
    name: 'React + Next.js',
    category: 'Frontend Framework',
    description:
      'Server-rendered React with App Router, streaming SSR, and edge-optimized bundles. Real-time WebSocket dashboards with zero-latency state hydration.',
    version: '19.1 / 16.1',
    color: '#06b6d4',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    metrics: [
      { label: 'Bundle', value: '89kb gzip' },
      { label: 'FCP', value: '0.8s' },
      { label: 'Lighthouse', value: '97' },
    ],
  },
  {
    name: 'Ensemble ML Pipeline',
    category: 'Intelligence Core',
    description:
      'Four-model ensemble: Random Forest, XGBoost, Autoencoder, Isolation Forest. Consensus voting with weighted confidence scoring across all classifiers.',
    version: 'v2.4',
    color: '#a855f7',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 11-4.95 2.05l4.95 4.95 4.95-4.95A6.97 6.97 0 0112 5z',
    metrics: [
      { label: 'Accuracy', value: '97.3%' },
      { label: 'F1 Score', value: '0.96' },
      { label: 'Inference', value: '< 8ms' },
    ],
  },
  {
    name: 'PostgreSQL + Redis',
    category: 'Data Layer',
    description:
      'PostgreSQL for persistent threat intelligence and audit trails. Redis for real-time session caching, pub/sub alert fanout, and rate limiting.',
    version: '16.4 / 7.4',
    color: '#f97316',
    icon: 'M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4M4 12c0 2.21 3.58 4 8 4s8-1.79 8-4',
    metrics: [
      { label: 'Queries/s', value: '45k' },
      { label: 'Cache Hit', value: '99.2%' },
      { label: 'Replication', value: 'Active' },
    ],
  },
  {
    name: 'Docker + CI/CD',
    category: 'Deployment',
    description:
      'Container-first architecture with multi-stage builds, GitHub Actions pipelines, automated testing, and zero-downtime rolling deployments.',
    version: '27.x',
    color: '#22c55e',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    metrics: [
      { label: 'Build', value: '< 90s' },
      { label: 'Deploy', value: '< 30s' },
      { label: 'Coverage', value: '92%' },
    ],
  },
];

// ── findScrollParent (same pattern as CanvasScrollEngine) ─────
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

// ── Component ───────────────────────────────────────────
export function TechStackSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { registerSection, setActiveSection } = useScrollytelling();
  const [activeCard, setActiveCard] = useState(0);

  const CARD_COUNT = techCards.length;
  const SECTION_INDEX = 5;
  const SCROLL_HEIGHT_VH = 400; // how much vertical scroll distance to map

  // Register with provider
  useEffect(() => {
    registerSection(SECTION_INDEX, sectionRef.current);
    return () => registerSection(SECTION_INDEX, null);
  }, [registerSection]);

  // Raw scroll progress within this section
  const rawProgress = useMotionValue(0);
  const rawEnter = useMotionValue(0);
  const rawExit = useMotionValue(0);

  const smoothProgress = useSpring(rawProgress, { stiffness: 60, damping: 30, restDelta: 0.001 });
  const smoothEnter = useSpring(rawEnter, { stiffness: 80, damping: 28, restDelta: 0.001 });
  const smoothExit = useSpring(rawExit, { stiffness: 80, damping: 28, restDelta: 0.001 });

  // Horizontal track translation (0% to -(N-1)*100vw)
  const trackX = useTransform(smoothProgress, [0, 1], ['0vw', `-${(CARD_COUNT - 1) * 100}vw`]);

  // Scrim fade (same cinematic pattern as CanvasScrubSection)
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

  // Card index from progress
  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (v) => {
      const idx = Math.round(v * (CARD_COUNT - 1));
      setActiveCard(idx);
    });
    return unsubscribe;
  }, [smoothProgress, CARD_COUNT]);

  // IntersectionObserver for active section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          setActiveSection(SECTION_INDEX);
        }
      },
      { threshold: [0.1, 0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setActiveSection]);

  // ── Native scroll listener (same pattern as engine) ──────
  useEffect(() => {
    const container = sectionRef.current;
    if (!container) return;

    const scrollParent =
      findScrollParent(container) ??
      (typeof window !== 'undefined' ? document.documentElement : null);
    if (!scrollParent) return;

    const computeProgress = () => {
      const containerRect = container.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      const relativeTop = containerRect.top - parentRect.top;
      const sectionHeight = container.offsetHeight;
      const viewportHeight = scrollParent.clientHeight;
      const scrollRange = sectionHeight - viewportHeight;
      if (scrollRange <= 0) return;

      const scrolled = -relativeTop;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      rawProgress.set(progress);

      const enterP = Math.max(0, Math.min(1, (viewportHeight - relativeTop) / viewportHeight));
      rawEnter.set(enterP);

      const exitP = Math.max(0, Math.min(1, (-relativeTop - scrollRange) / viewportHeight));
      rawExit.set(exitP);
    };

    computeProgress();

    const target = scrollParent === document.documentElement ? window : scrollParent;
    target.addEventListener('scroll', computeProgress, { passive: true });
    window.addEventListener('resize', computeProgress, { passive: true });

    return () => {
      target.removeEventListener('scroll', computeProgress);
      window.removeEventListener('resize', computeProgress);
    };
  }, [rawProgress, rawEnter, rawExit]);

  return (
    <section
      ref={sectionRef}
      id="tech-stack"
      style={{
        height: `${SCROLL_HEIGHT_VH}vh`,
        position: 'relative',
        background: '#000',
      }}
    >
      {/* ── Sticky Viewport ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {/* Animated Scale Wrapper */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            scale: contentScale,
            transformOrigin: 'center center',
          }}
        >
          {/* ── Animated Background ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 120% 100% at 20% 50%, rgba(15,25,45,0.9) 0%, #000 70%)',
              zIndex: 0,
            }}
          />

          {/* ── Subtle Grid Pattern ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
              zIndex: 1,
            }}
          />

          {/* ── Horizontal Track ── */}
          <motion.div
            ref={trackRef}
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              width: `${CARD_COUNT * 100}vw`,
              height: '100%',
              x: trackX,
              zIndex: 10,
            }}
          >
            {techCards.map((card, index) => (
              <TechCardPanel
                key={card.name}
                card={card}
                index={index}
                isActive={activeCard === index}
                totalCards={CARD_COUNT}
              />
            ))}
          </motion.div>

          {/* ── Bottom Progress Dots ── */}
          <div
            style={{
              position: 'absolute',
              bottom: '3.5vh',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              zIndex: 40,
            }}
          >
            {techCards.map((card, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: activeCard === i ? 1 : 0.3,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <div
                  style={{
                    width: activeCard === i ? '28px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: activeCard === i ? card.color : 'rgba(255,255,255,0.3)',
                    boxShadow: activeCard === i ? `0 0 12px ${card.color}66` : 'none',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
                {activeCard === i && (
                  <span
                    style={{
                      fontFamily: '"SF Mono", monospace',
                      fontSize: '0.55rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {card.category}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Section Counter ── */}
          <div
            style={{
              position: 'absolute',
              top: '3vh',
              right: 'clamp(2rem, 5vw, 4rem)',
              fontFamily: '"SF Mono", monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.2)',
              zIndex: 40,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
              {String(activeCard + 1).padStart(2, '0')}
            </span>
            &nbsp;/&nbsp;{String(CARD_COUNT).padStart(2, '0')}
          </div>
        </motion.div>

        {/* ── Cinematic Fade Scrim ── */}
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
    </section>
  );
}

// ═══════════════════════════════════════════════════════
// Individual Tech Card Panel (100vw each)
// ═══════════════════════════════════════════════════════
function TechCardPanel({
  card,
  index,
  isActive,
  totalCards,
}: {
  card: TechCard;
  index: number;
  isActive: boolean;
  totalCards: number;
}) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 5vw, 5rem)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Ambient glow behind the card */}
      <div
        style={{
          position: 'absolute',
          width: '50vw',
          height: '50vh',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${card.color}12 0%, transparent 70%)`,
          filter: 'blur(60px)',
          opacity: isActive ? 0.8 : 0,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Card Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(2rem, 5vw, 5rem)',
          maxWidth: '1100px',
          width: '100%',
          alignItems: 'center',
          opacity: isActive ? 1 : 0.15,
          transform: isActive ? 'scale(1)' : 'scale(0.92)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Left: Text Content ── */}
        <div>
          {/* Category badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              background: `${card.color}12`,
              border: `1px solid ${card.color}30`,
              borderRadius: '6px',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: card.color,
                boxShadow: `0 0 8px ${card.color}`,
              }}
            />
            <span
              style={{
                fontFamily: '"SF Mono", monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: card.color,
              }}
            >
              {card.category}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: '-apple-system, "Inter", sans-serif',
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: '#fff',
              marginBottom: '1.5rem',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {card.name}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: '-apple-system, "Inter", sans-serif',
              fontSize: 'clamp(0.9rem, 1.2vw, 1rem)',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '420px',
              marginBottom: '2.5rem',
            }}
          >
            {card.description}
          </p>

          {/* Version tag */}
          <div
            style={{
              fontFamily: '"SF Mono", monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
            }}
          >
            VERSION {card.version}
          </div>
        </div>

        {/* ── Right: Icon + Metrics ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2.5rem',
          }}
        >
          {/* Large Icon Container */}
          <div
            style={{
              position: 'relative',
              width: '200px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Orbit ring */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `1px solid ${card.color}20`,
                animation: isActive ? 'spin-slow 20s linear infinite' : 'none',
              }}
            />
            {/* Inner ring */}
            <div
              style={{
                position: 'absolute',
                inset: '25px',
                borderRadius: '50%',
                border: `1px dashed ${card.color}15`,
                animation: isActive ? 'spin-slow 15s linear infinite reverse' : 'none',
              }}
            />
            {/* Glow core */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${card.color}30 0%, transparent 70%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke={card.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: `drop-shadow(0 0 12px ${card.color}66)`,
                }}
              >
                <path d={card.icon} />
              </svg>
            </div>

            {/* Orbiting dot */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: card.color,
                boxShadow: `0 0 10px ${card.color}`,
                animation: isActive ? 'spin-slow 20s linear infinite' : 'none',
                transformOrigin: '0 100px',
              }}
            />
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            {card.metrics.map((m) => (
              <div
                key={m.label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '1rem 0.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
                    fontWeight: 800,
                    color: card.color,
                    marginBottom: '0.4rem',
                    filter: `drop-shadow(0 0 8px ${card.color}44)`,
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
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card number watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: '12vh',
          right: 'clamp(3rem, 8vw, 8rem)',
          fontFamily: '-apple-system, "Inter", sans-serif',
          fontSize: 'clamp(6rem, 15vw, 14rem)',
          fontWeight: 900,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.015)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>
    </div>
  );
}