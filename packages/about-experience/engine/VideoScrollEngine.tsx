'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Video Scroll Engine
// Spring-damped scroll → video playhead mapping
// ═══════════════════════════════════════════════════════

import { useRef, useCallback, useEffect, RefObject } from 'react';
import { useScroll, useSpring, useTransform, MotionValue } from 'framer-motion';

interface VideoScrubReturn {
  scrollYProgress: MotionValue<number>;
  videoY: MotionValue<number>;
  opacity: MotionValue<number>;
  ref: RefObject<HTMLDivElement | null>;
}

export function useVideoScrub(
  videoRef: RefObject<HTMLVideoElement | null>,
  sectionRef?: RefObject<HTMLDivElement | null>
): VideoScrubReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = sectionRef || containerRef;

  // Track scroll progress relative to section
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  // Spring-damped progress for smooth video scrubbing
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  // Transform scroll progress to video playhead
  const videoY = useTransform(smoothProgress, [0, 1], [0, -50]);

  // Parallax opacity based on scroll
  const opacity = useTransform(
    smoothProgress,
    [0, 0.2, 0.8, 1],
    [0.3, 1, 1, 0.3]
  );

  // Scrub video based on scroll position
  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (latest) => {
      const video = videoRef.current;
      if (video && video.duration && isFinite(video.duration)) {
        // Map scroll progress to video time
        const targetTime = latest * video.duration;
        // Only update if difference is significant to avoid jitter
        if (Math.abs(video.currentTime - targetTime) > 0.05) {
          video.currentTime = targetTime;
        }
      }
    });

    return () => unsubscribe();
  }, [smoothProgress, videoRef]);

  // IntersectionObserver: play when >40% visible, pause off-screen
  useEffect(() => {
    const container = targetRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            // Play video when sufficiently visible
            video.play().catch(() => {
              // Autoplay may be blocked — silent fail
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.4, 1] }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [targetRef, videoRef]);

  return {
    scrollYProgress,
    videoY,
    opacity,
    ref: containerRef,
  };
}