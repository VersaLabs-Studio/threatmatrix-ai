'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Scrollytelling Provider
// React Context for global scroll state with spring damping
// ═══════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useScroll, useSpring, useMotionValueEvent } from 'framer-motion';

// ── Types ─────────────────────────────────────────────
interface ScrollytellingState {
  currentSection: number;      // 0-7 active section index
  sectionProgress: number;     // 0-1 progress within current section
  globalProgress: number;      // 0-1 entire page progress
  direction: 'up' | 'down';
  setActiveSection: (i: number) => void;
  registerSection: (index: number, el: HTMLElement | null) => void;
  scrollToSection: (index: number) => void;
}

const ScrollytellingContext = createContext<ScrollytellingState | null>(null);

// ── Provider ──────────────────────────────────────────
export function ScrollytellingProvider({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const sectionsRef = useRef<Map<number, HTMLElement>>(new Map());
  const prevProgress = useRef(0);

  // Global scroll tracking
  const { scrollYProgress } = useScroll();

  // Spring-damped global progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  // Track global progress changes
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const newDirection = latest > prevProgress.current ? 'down' : 'up';
    setDirection(newDirection);
    prevProgress.current = latest;

    // Calculate which section we're in based on global progress
    const totalSections = 8;
    const sectionIndex = Math.min(
      Math.floor(latest * totalSections),
      totalSections - 1
    );
    const progressInSection = (latest * totalSections) - sectionIndex;

    setCurrentSection(sectionIndex);
    setSectionProgress(Math.min(1, Math.max(0, progressInSection)));
  });

  // Register section elements for scrollIntoView
  const registerSection = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      sectionsRef.current.set(index, el);
    } else {
      sectionsRef.current.delete(index);
    }
  }, []);

  // Scroll to a specific section
  const scrollToSection = useCallback((index: number) => {
    const el = sectionsRef.current.get(index);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const setActiveSection = useCallback((i: number) => {
    setCurrentSection(i);
  }, []);

  const value: ScrollytellingState = {
    currentSection,
    sectionProgress,
    globalProgress: scrollYProgress.get(),
    direction,
    setActiveSection,
    registerSection,
    scrollToSection,
  };

  return (
    <ScrollytellingContext.Provider value={value}>
      {children}
    </ScrollytellingContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────
export function useScrollytelling() {
  const context = useContext(ScrollytellingContext);
  if (!context) {
    throw new Error('useScrollytelling must be used within a ScrollytellingProvider');
  }
  return context;
}