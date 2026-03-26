'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Cinematic Video Section
// Reusable section shell with lazy video loading + parallax
// ═══════════════════════════════════════════════════════

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { useVideoScrub } from './VideoScrollEngine';
import { useScrollytelling } from './ScrollytellingProvider';

interface CinematicVideoSectionProps {
  videoSrc?: string;
  posterSrc?: string;
  sectionIndex: number;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function CinematicVideoSection({
  videoSrc,
  posterSrc,
  sectionIndex,
  children,
  className = '',
  id,
}: CinematicVideoSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const { setActiveSection, registerSection } = useScrollytelling();

  // Check for slow connection
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
      if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
        setIsSlowConnection(true);
      }
    }
  }, []);

  // Register section with scrollytelling provider
  useEffect(() => {
    registerSection(sectionIndex, sectionRef.current);
    return () => registerSection(sectionIndex, null);
  }, [sectionIndex, registerSection]);

  // Lazy load video on near-entry
  useEffect(() => {
    if (isSlowConnection || !videoSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isSlowConnection, videoSrc]);

  // Track when section is in view and update active section
  const isInView = useInView(sectionRef, { amount: 0.4 });
  useEffect(() => {
    if (isInView) {
      setActiveSection(sectionIndex);
    }
  }, [isInView, sectionIndex, setActiveSection]);

  // Video scrub engine
  const { videoY, opacity } = useVideoScrub(videoRef, sectionRef);

  // Determine if we should show video or poster
  const showVideo = shouldLoad && videoSrc && !isSlowConnection;

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`video-section ${className}`}
      data-section-index={sectionIndex}
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      {/* Background Video / Poster */}
      <div
        className="video-wrapper"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {/* Gradient fallback */}
        <div
          className="video-gradient-fallback"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1117 50%, #161b22 100%)',
          }}
        />

        {/* Poster image fallback */}
        {posterSrc && (
          <motion.img
            src={posterSrc}
            alt=""
            className="bg-poster"
            initial={{ opacity: 0 }}
            animate={{ opacity: posterLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            onLoad={() => setPosterLoaded(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              willChange: 'transform',
            }}
          />
        )}

        {/* Video element */}
        {showVideo && (
          <motion.video
            ref={videoRef}
            className="bg-video"
            src={videoSrc}
            poster={posterSrc}
            preload="metadata"
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              y: videoY,
              opacity: opacity,
              willChange: 'transform',
            }}
          />
        )}

        {/* Sentinel overlay — scanlines, vignette, grain */}
        <div className="sentinel-overlay" />
      </div>

      {/* Content */}
      <motion.div
        className="section-content"
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  );
}