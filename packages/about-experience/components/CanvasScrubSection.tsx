'use client';

import React, { useRef, useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence, useTransform } from 'framer-motion';
import { useFrameSequence } from '../engine/useFrameSequence';
import { useCanvasScrollEngine } from '../engine/CanvasScrollEngine';
import { useScrollytelling } from '../engine/ScrollytellingProvider';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — CanvasScrubSection
 * Shell component for high-performance scroll scrubbing
 *
 * FIXED:
 *  - `disabled` prop added: shows gradient fallback when
 *    no frames are available (prevents 404 floods)
 *  - Passes `isReady` to engine so frame 0 draws on load
 *  - Overlay positioning fixed: uses flex stacking, not
 *    stacked absolute children inside absolute parents
 * ═══════════════════════════════════════════════════════
 */

interface OverlayConfig {
  label: string;
  startFrame: number;
  endFrame: number;
  content: ReactNode;
}

interface CanvasScrubSectionProps {
  framesBasePath: string;
  totalFrames: number;
  sectionIndex: number;
  id?: string;
  className?: string;
  children?: ReactNode;
  overlays?: OverlayConfig[];
  scrollMultiplier?: number;
  disabled?: boolean; // When true, shows gradient fallback (no frame loading)
  fallbackGradient?: string;
}

export function CanvasScrubSection({
  framesBasePath,
  totalFrames,
  sectionIndex,
  id,
  className = '',
  children,
  overlays = [],
  scrollMultiplier = 500,
  disabled = false,
  fallbackGradient = 'linear-gradient(135deg, #0a0a0a 0%, #0d1117 50%, #161b22 100%)',
}: CanvasScrubSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const { registerSection, setActiveSection } = useScrollytelling();

  // Register section with provider
  useEffect(() => {
    registerSection(sectionIndex, containerRef.current);
    return () => registerSection(sectionIndex, null);
  }, [sectionIndex, registerSection]);

  // When disabled, pass totalFrames=0 → useFrameSequence allocates nothing and fires no requests
  const { isReady, loadProgress, images } = useFrameSequence({
    basePath: framesBasePath,
    totalFrames: disabled ? 0 : totalFrames,
    firstBatch: disabled ? 0 : 15,
  });

  const { smoothEnter, smoothExit } = useCanvasScrollEngine({
    canvasRef,
    containerRef,
    images,
    totalFrames: disabled ? 1 : totalFrames,
    isReady: disabled ? false : isReady,
    overlayTriggers: overlays,
    onFrameChange: (frame, active) => {
      setActiveOverlays(active);
    },
  });

  // ── Cinematic Cross-Section Transition Logic ─────────────────
  // Scrim (black overlay) opacity:
  // - Entering: fades from 1 (black) to 0 (clear)
  // - Exiting: fades from 0 (clear) to 1 (black)
  const scrimOpacity = useTransform(() => {
    const enterP = smoothEnter.get();
    const exitP = smoothExit.get();
    if (enterP < 0.999) return 1 - enterP;
    return exitP;
  });

  // Content scale:
  // - Entering: zooms down from 1.05 to 1.0
  // - Exiting: zooms down from 1.0 to 0.95
  const contentScale = useTransform(() => {
    const enterP = smoothEnter.get();
    const exitP = smoothExit.get();
    if (enterP < 0.999) return 1.05 - (enterP * 0.05);
    return 1 - (exitP * 0.05);
  });

  // IntersectionObserver for active section tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          setActiveSection(sectionIndex);
        }
      },
      { threshold: [0.1, 0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionIndex, setActiveSection]);

  const showCanvas = !disabled && isReady;
  const showPreloader = !disabled && !isReady;

  return (
    <div
      ref={containerRef}
      id={id}
      className={`canvas-scrub-section ${className}`}
      style={{
        height: `${scrollMultiplier}vh`,
        position: 'relative',
        background: '#000',
      }}
    >
      {/* Sticky viewport */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#000' }}>
        
        {/* Animated content wrapper (handles scale transitions) */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            scale: contentScale,
            transformOrigin: 'center center',
          }}
        >
          {/* Gradient background — always visible as base layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: fallbackGradient,
              zIndex: 0,
            }}
          />

          {/* Loading bar */}
          {showPreloader && (
            <div className="canvas-preloader" style={{ zIndex: 50 }}>
              <div className="canvas-preloader__bar">
                <div
                  className="canvas-preloader__fill"
                  style={{ width: `${Math.round(loadProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Canvas — fades over gradient when ready */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: showCanvas ? 1 : 0,
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 1,
            }}
          />

        {/* Global VFX layer */}
        <div className="sentinel-overlay" style={{ zIndex: 2 }} />

        {/* Frame-triggered overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <AnimatePresence>
            {overlays.map((overlay) =>
              activeOverlays.includes(overlay.label) ? (
                <motion.div
                  key={overlay.label}
                  initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                  }}
                >
                  {overlay.content}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Static children (always visible) */}
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
          {children}
        </div>
        
        </motion.div>

        {/* Cinematic Fade Scrim (black overlay) */}
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
    </div>
  );
}
