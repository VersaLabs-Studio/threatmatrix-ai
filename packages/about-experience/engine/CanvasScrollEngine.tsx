'use client';

import { useRef, useEffect, useCallback, RefObject } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — useCanvasScrollEngine v3
 *
 * SCROLL-JITTER FIX — Root Cause Analysis:
 *
 * THREE cascading bugs caused the video to snap back to
 * frame 0 whenever the user stopped scrolling:
 *
 * BUG 1: The scroll-listener useEffect had `rawProgress`
 *   in its dependency array. MotionValue.set() triggered
 *   React's effect teardown → reattach cycle. During the
 *   gap, computeProgress() ran with stale DOM rects and
 *   briefly read progress=0, snapping the spring to 0.
 *
 * BUG 2: The scheduleRender callback depended on
 *   `onFrameChange` and `overlayTriggers`, which were
 *   inline closures recreated on every render of the
 *   parent component. This cascaded into the spring-→
 *   frame effect being torn down and resubscribed.
 *
 * BUG 3: Spring config (stiffness:80, damping:28) was
 *   underdamped — the spring oscillated on stop, causing
 *   frame bounce. Changed to critically-damped values.
 *
 * FIXES APPLIED:
 *   1. Removed all MotionValues from useEffect deps.
 *      MotionValues are mutable refs; they must never be
 *      in dependency arrays.
 *   2. Stored onFrameChange and overlayTriggers in refs
 *      so their identity never changes.
 *   3. Used critically-damped spring (stiffness:120,
 *      damping:40) — settles fast with zero overshoot.
 * ═══════════════════════════════════════════════════════
 */

interface OverlayTrigger {
  label: string;
  startFrame: number;
  endFrame: number;
}

interface CanvasScrollEngineOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  images: HTMLImageElement[];
  totalFrames: number;
  isReady: boolean;
  overlayTriggers?: OverlayTrigger[];
  onFrameChange?: (frame: number, activeOverlays: string[]) => void;
}

// ── Walk up DOM to find the real scroll container ────────────────
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

export function useCanvasScrollEngine({
  canvasRef,
  containerRef,
  images,
  totalFrames,
  isReady,
  overlayTriggers = [],
  onFrameChange,
}: CanvasScrollEngineOptions) {
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);

  // ── FIX BUG 2: Store callbacks in stable refs ────────────────
  const onFrameChangeRef = useRef(onFrameChange);
  onFrameChangeRef.current = onFrameChange;

  const overlayTriggersRef = useRef(overlayTriggers);
  overlayTriggersRef.current = overlayTriggers;

  const imagesRef = useRef(images);
  imagesRef.current = images;

  // ── MotionValues (stable across renders — never put in deps) ──
  const rawProgress = useMotionValue(0);
  const rawEnter = useMotionValue(0);
  const rawExit = useMotionValue(0);

  // ── FIX BUG 3: Critically-damped spring (zero overshoot) ─────
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 120,
    damping: 40,
    restDelta: 0.0005,
  });
  const smoothEnter = useSpring(rawEnter, {
    stiffness: 120,
    damping: 40,
    restDelta: 0.001,
  });
  const smoothExit = useSpring(rawExit, {
    stiffness: 120,
    damping: 40,
    restDelta: 0.001,
  });

  // ── Draw frame to canvas with "cover" scaling ────────────────
  const drawImageToCanvas = useCallback(
    (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (cw === 0 || ch === 0 || iw === 0 || ih === 0) return;

      const scale = Math.max(cw / iw, ch / ih);
      const scaledW = iw * scale;
      const scaledH = ih * scale;
      const offsetX = (cw - scaledW) / 2;
      const offsetY = (ch - scaledH) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
    },
    []
  );

  // ── Draw a specific frame ────────────────────────────────────
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      const imgs = imagesRef.current;
      if (!canvas || imgs.length === 0) return;

      let img = imgs[frameIndex];

      // If this exact frame isn't loaded yet, walk backwards for a loaded neighbour
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let i = 1; i < 15; i++) {
          const fallback = imgs[frameIndex - i];
          if (fallback && fallback.complete && fallback.naturalWidth > 0) {
            drawImageToCanvas(canvas, fallback);
            return;
          }
        }
        return;
      }

      drawImageToCanvas(canvas, img);
    },
    [canvasRef, drawImageToCanvas]
  );

  // ── RAF-batched render ────────────────────────────────────────
  const scheduleRender = useCallback(
    (targetFrame: number, notify = true) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        drawFrame(targetFrame);
        lastDrawnFrameRef.current = targetFrame;

        if (notify && onFrameChangeRef.current) {
          const triggers = overlayTriggersRef.current;
          const activeOverlays = triggers
            .filter(
              (t) => targetFrame >= t.startFrame && targetFrame <= t.endFrame
            )
            .map((t) => t.label);
          onFrameChangeRef.current(targetFrame, activeOverlays);
        }
      });
    },
    [drawFrame] // ← stable! No more inline closures in deps
  );

  // ── FIX BUG 1: Scroll listener — EMPTY dependency array ─────
  // MotionValues are mutable refs. They must NEVER appear in
  // useEffect dependency arrays because .set() does not trigger
  // React re-renders, but if listed, React's strict-mode double-
  // invocation or HMR can tear down and re-create the listener,
  // causing a brief moment where computeProgress reads stale
  // DOM measurements and resets rawProgress to 0.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollParent =
      findScrollParent(container) ??
      (typeof window !== 'undefined'
        ? document.documentElement || null
        : null);
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

      const enterP = Math.max(
        0,
        Math.min(1, (viewportHeight - relativeTop) / viewportHeight)
      );
      rawEnter.set(enterP);

      const exitP = Math.max(
        0,
        Math.min(1, (-relativeTop - scrollRange) / viewportHeight)
      );
      rawExit.set(exitP);
    };

    computeProgress();

    // Listen on the scroll parent (the fixed-position layout wrapper)
    const target =
      scrollParent === document.documentElement ? window : scrollParent;
    target.addEventListener('scroll', computeProgress, { passive: true });
    window.addEventListener('resize', computeProgress, { passive: true });

    return () => {
      target.removeEventListener('scroll', computeProgress);
      window.removeEventListener('resize', computeProgress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← EMPTY! containerRef is a stable ref, MotionValues are stable.

  // ── Spring progress → frame index ────────────────────────────
  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (progress) => {
      const targetFrame = Math.round(
        Math.max(0, Math.min(1, progress)) * (totalFrames - 1)
      );
      if (targetFrame !== lastDrawnFrameRef.current) {
        currentFrameRef.current = targetFrame;
        scheduleRender(targetFrame);
      }
    });
    return () => {
      unsubscribe();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [smoothProgress, totalFrames, scheduleRender]);

  // ── Draw frame 0 as soon as images are ready ─────────────────
  useEffect(() => {
    if (isReady && imagesRef.current.length > 0) {
      const timer = setTimeout(() => scheduleRender(0, false), 80);
      return () => clearTimeout(timer);
    }
  }, [isReady, scheduleRender]);

  // ── ResizeObserver — keeps canvas pixel-perfect ───────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        drawFrame(currentFrameRef.current);
      }
    });

    ro.observe(parent);
    return () => ro.disconnect();
  }, [canvasRef, drawFrame]);

  return { smoothProgress, smoothEnter, smoothExit };
}
