'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════
 * ThreatMatrix AI — useFrameSequence
 * Background frame preloading for smooth canvas scrubbing
 *
 * FIXED:
 *  - `onerror` no longer counts toward `isReady` (404s were
 *    triggering the canvas to become "ready" with no images)
 *  - Frame 0 is now draw-ready when isReady flips
 *  - Graceful timeout fallback if network is very slow
 * ═══════════════════════════════════════════════════════
 */

interface FrameSequenceOptions {
  basePath: string;
  totalFrames: number;
  extension?: string;
  digits?: number;
  firstBatch?: number;
}

interface FrameSequenceReturn {
  images: HTMLImageElement[];
  isReady: boolean;
  loadProgress: number;
  successfulFrames: number;
}

export function useFrameSequence({
  basePath,
  totalFrames,
  extension = 'jpg',
  digits = 4,
  firstBatch = 15,
}: FrameSequenceOptions): FrameSequenceReturn {
  const imagesRef = useRef<HTMLImageElement[] | null>(null);

  // Initialize images only on the client — skip entirely when totalFrames=0 (disabled)
  if (!imagesRef.current && typeof window !== 'undefined' && totalFrames > 0) {
    imagesRef.current = Array.from({ length: totalFrames }, () => new window.Image());
  }

  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [successfulFrames, setSuccessfulFrames] = useState(0);
  const loadedCount = useRef(0);
  const successCount = useRef(0);
  const firstBatchSuccessCount = useRef(0);

  useEffect(() => {
    const images = imagesRef.current;
    if (!images || images.length === 0) return;

    loadedCount.current = 0;
    successCount.current = 0;
    firstBatchSuccessCount.current = 0;

    // ── Success handler: counts toward isReady ────────────────────
    const onSuccess = (index: number) => () => {
      loadedCount.current++;
      successCount.current++;
      setLoadProgress(loadedCount.current / totalFrames);
      setSuccessfulFrames(successCount.current);

      if (index < firstBatch) {
        firstBatchSuccessCount.current++;
        // Only become "ready" when we have firstBatch SUCCESSFUL loads
        if (firstBatchSuccessCount.current >= firstBatch) {
          setIsReady(true);
        }
      }
    };

    // ── Error handler: progresses the bar but does NOT trigger isReady ──
    const onError = () => {
      loadedCount.current++;
      setLoadProgress(loadedCount.current / totalFrames);
    };

    images.forEach((img, i) => {
      const frameNum = (i + 1).toString().padStart(digits, '0');
      img.src = `${basePath}${frameNum}.${extension}`;
      img.onload = onSuccess(i);
      img.onerror = onError;
    });

    // ── Failsafe: if all frames 404, still show canvas after 3s ──────
    const timeout = setTimeout(() => {
      if (!isReady) setIsReady(true);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      images.forEach(img => {
        img.src = '';
        img.onload = null;
        img.onerror = null;
      });
      loadedCount.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, totalFrames, extension, digits, firstBatch]);

  return {
    images: imagesRef.current || [],
    isReady,
    loadProgress,
    successfulFrames,
  };
}
