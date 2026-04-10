'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — ML Section v2
 *
 * "Ensemble Intelligence" — convergent neural constellation
 *
 * Scroll choreography:
 *  0–0.2   : Introduction headline materializes
 *  0.2–0.5 : Four model nodes orbit inward and lock
 *  0.5–0.7 : Central "consensus" core ignites
 *  0.7–1.0 : Ensemble formula + final metrics
 *
 * No video — pure SVG constellation + Framer Motion.
 * ═══════════════════════════════════════════════════════
 */

const models = [
  {
    name: 'Random Forest',
    accuracy: 97.2,
    role: 'Primary Classifier',
    color: '#00e5ff',
    icon: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
    angle: 0,
  },
  {
    name: 'XGBoost',
    accuracy: 96.8,
    role: 'Gradient Booster',
    color: '#3b82f6',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    angle: 90,
  },
  {
    name: 'Autoencoder',
    accuracy: 95.4,
    role: 'Anomaly Detector',
    color: '#a855f7',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14a4 4 0 110-8 4 4 0 010 8z',
    angle: 180,
  },
  {
    name: 'Isolation Forest',
    accuracy: 94.1,
    role: 'Outlier Hunter',
    color: '#f97316',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    angle: 270,
  },
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

export function MLSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { registerSection, setActiveSection } = useScrollytelling();
  const [phase, setPhase] = useState(0); // 0=intro, 1=nodes, 2=converge, 3=ensemble

  const SECTION_INDEX = 3;
  const SCROLL_HEIGHT_VH = 500;

  useEffect(() => {
    registerSection(SECTION_INDEX, sectionRef.current);
    return () => registerSection(SECTION_INDEX, null);
  }, [registerSection]);

  const rawProgress = useMotionValue(0);
  const rawEnter = useMotionValue(0);
  const rawExit = useMotionValue(0);

  const smoothProgress = useSpring(rawProgress, { stiffness: 50, damping: 30, restDelta: 0.001 });
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

  // Phase tracking
  useEffect(() => {
    const unsub = smoothProgress.on('change', (v) => {
      if (v < 0.2) setPhase(0);
      else if (v < 0.5) setPhase(1);
      else if (v < 0.7) setPhase(2);
      else setPhase(3);
    });
    return unsub;
  }, [smoothProgress]);

  // IntersectionObserver
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

  // Native scroll
  useEffect(() => {
    const container = sectionRef.current;
    if (!container) return;
    const scrollParent =
      findScrollParent(container) ??
      (typeof window !== 'undefined' ? document.documentElement : null);
    if (!scrollParent) return;

    const compute = () => {
      const cR = container.getBoundingClientRect();
      const pR = scrollParent.getBoundingClientRect();
      const relTop = cR.top - pR.top;
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

  // Node orbit radius interpolation (far → close)
  const orbitRadius = useTransform(smoothProgress, [0.15, 0.6], [180, 0]);

  // Center glow intensity
  const centerGlow = useTransform(smoothProgress, [0.45, 0.7], [0, 1]);

  // Ensemble accuracy (converged)
  const ensembleAccuracy = useMemo(() => {
    const totalWeight = models.reduce((s, m) => s + m.accuracy, 0);
    return (totalWeight / models.length).toFixed(1);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ml"
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
          {/* BG */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 90% 80% at 60% 50%, rgba(40,10,60,0.4) 0%, #000 70%)',
            }}
          />

          {/* ── Left Panel: Text ── */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(2rem, 6vw, 5rem)',
              top: '50%',
              transform: 'translateY(-50%)',
              maxWidth: '380px',
              zIndex: 20,
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.9rem',
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: '6px',
                marginBottom: '2rem',
                opacity: phase >= 0 ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
            >
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#a855f7',
                  boxShadow: '0 0 8px #a855f7',
                  animation: 'blink-dot 1.5s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontFamily: '"SF Mono", monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#a855f7',
                }}
              >
                Machine Learning
              </span>
            </div>

            {/* Headline */}
            <h2
              style={{
                fontFamily: '-apple-system, "Inter", sans-serif',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                color: '#fff',
                marginBottom: '1.5rem',
                opacity: phase >= 0 ? 1 : 0,
                transform: phase >= 0 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              ENSEMBLE
              <br />
              <span
                style={{
                  background: 'linear-gradient(100deg, #a855f7, #7c3aed, #6d28d9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.3))',
                }}
              >
                INTELLIGENCE
              </span>
            </h2>

            <p
              style={{
                fontFamily: '-apple-system, "Inter", sans-serif',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.45)',
                marginBottom: '2rem',
                opacity: phase >= 0 ? 1 : 0,
                transition: 'opacity 0.8s ease 0.2s',
              }}
            >
              Four complementary models vote on every packet in real time —
              supervised and unsupervised learning converging into a single verdict.
            </p>

            {/* ── Formula (Phase 3) ── */}
            <div
              style={{
                padding: '1rem 1.25rem',
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.15)',
                borderRadius: '10px',
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div
                style={{
                  fontFamily: '"SF Mono", monospace',
                  fontSize: '0.5rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: '0.5rem',
                }}
              >
                Ensemble Prediction
              </div>
              <div
                style={{
                  fontFamily: '"SF Mono", monospace',
                  fontSize: '0.9rem',
                  color: '#a855f7',
                }}
              >
                Σ(w<sub>i</sub> × f<sub>i</sub>(x)) / Σw<sub>i</sub>
              </div>
              <div
                style={{
                  fontFamily: '"SF Mono", monospace',
                  fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.2)',
                  marginTop: '0.3rem',
                }}
              >
                where w<sub>i</sub> = accuracy_weight
              </div>
            </div>

            {/* ── Ensemble Score (Phase 3) ── */}
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                gap: '2rem',
                opacity: phase >= 3 ? 1 : 0,
                transition: 'opacity 0.6s ease 0.3s',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#a855f7',
                    filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.5))',
                    lineHeight: 1,
                  }}
                >
                  {ensembleAccuracy}%
                </div>
                <div
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: '0.5rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                    marginTop: '0.3rem',
                  }}
                >
                  Ensemble Accuracy
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#7c3aed',
                    filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.5))',
                    lineHeight: 1,
                  }}
                >
                  0.96
                </div>
                <div
                  style={{
                    fontFamily: '"SF Mono", monospace',
                    fontSize: '0.5rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                    marginTop: '0.3rem',
                  }}
                >
                  F1 Score
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Constellation Visualization ── */}
          <div
            style={{
              position: 'absolute',
              right: 'clamp(4rem, 12vw, 15vw)',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '420px',
              height: '420px',
              zIndex: 10,
            }}
          >
            {/* Central Core */}
            <motion.div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                x: '-50%',
                y: '-50%',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: useTransform(
                  centerGlow,
                  [0, 1],
                  ['rgba(168,85,247,0.05)', 'rgba(168,85,247,0.2)']
                ),
                border: '1px solid rgba(168,85,247,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: useTransform(
                  centerGlow,
                  [0, 1],
                  ['0 0 0px rgba(168,85,247,0)', '0 0 60px rgba(168,85,247,0.4)']
                ),
              }}
            >
              <div
                style={{
                  fontFamily: '"SF Mono", monospace',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#a855f7',
                  textAlign: 'center',
                  opacity: phase >= 2 ? 1 : 0.3,
                  transition: 'opacity 0.6s ease',
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2px' }}>Σ</div>
                VOTE
              </div>
            </motion.div>

            {/* Outer ring */}
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                borderRadius: '50%',
                border: '1px solid rgba(168,85,247,0.06)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '60px',
                borderRadius: '50%',
                border: '1px dashed rgba(168,85,247,0.04)',
              }}
            />

            {/* ── Model Nodes ── */}
            {models.map((model, i) => {
              const angleRad = (model.angle * Math.PI) / 180;
              // Position: orbit radius interpolated from 180 → 0
              return (
                <ModelNode
                  key={model.name}
                  model={model}
                  index={i}
                  phase={phase}
                  angleRad={angleRad}
                  orbitRadius={orbitRadius}
                />
              );
            })}

            {/* Connection lines (phase >= 2) */}
            <svg
              width="420"
              height="420"
              style={{
                position: 'absolute',
                inset: 0,
                opacity: phase >= 2 ? 0.4 : 0,
                transition: 'opacity 0.8s ease',
              }}
            >
              {models.map((model, i) => {
                const angleRad = (model.angle * Math.PI) / 180;
                const r = phase >= 2 ? 80 : 180;
                const cx = 210 + Math.cos(angleRad) * r;
                const cy = 210 + Math.sin(angleRad) * r;
                return (
                  <line
                    key={i}
                    x1="210"
                    y1="210"
                    x2={cx}
                    y2={cy}
                    stroke={model.color}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="8;0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </line>
                );
              })}
            </svg>
          </div>
        </motion.div>

        {/* Scrim */}
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
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

// ═══════════════════════════════════════════════════════
// Model Node — orbiting element
// ═══════════════════════════════════════════════════════
function ModelNode({
  model,
  index,
  phase,
  angleRad,
  orbitRadius,
}: {
  model: (typeof models)[number];
  index: number;
  phase: number;
  angleRad: number;
  orbitRadius: MotionValue<number>;
}) {
  const x = useTransform(orbitRadius, (r: number) => 210 + Math.cos(angleRad) * r - 40);
  const y = useTransform(orbitRadius, (r: number) => 210 + Math.sin(angleRad) * r - 40);

  const isVisible = phase >= 1;
  const isConverged = phase >= 2;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: '80px',
        opacity: isVisible ? 1 : 0,
        transition: `opacity 0.6s ease ${index * 0.1}s`,
      }}
    >
      {/* Node circle */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `${model.color}10`,
          border: `1px solid ${model.color}${isConverged ? '50' : '25'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.6s ease',
          boxShadow: isConverged ? `0 0 20px ${model.color}22` : 'none',
          position: 'relative',
        }}
      >
        {/* Pulse ring */}
        {isConverged && (
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: `1px solid ${model.color}40`,
              animation: 'pulse-ring 2s ease-out infinite',
            }}
          />
        )}

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={model.color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${model.color}66)` }}
        >
          <path d={model.icon} />
        </svg>
        <div
          style={{
            fontFamily: '"SF Mono", monospace',
            fontSize: '0.45rem',
            letterSpacing: '0.08em',
            color: model.color,
            marginTop: '3px',
          }}
        >
          {model.accuracy}%
        </div>
      </div>

      {/* Label */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '0.4rem',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <div
          style={{
            fontFamily: '-apple-system, "Inter", sans-serif',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          {model.name}
        </div>
        <div
          style={{
            fontFamily: '"SF Mono", monospace',
            fontSize: '0.45rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          {model.role}
        </div>
      </div>
    </motion.div>
  );
}