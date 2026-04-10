'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — About Page
// Cinematic standalone experience
// ═══════════════════════════════════════════════════════

import React from 'react';
import { ScrollytellingProvider } from '@about-experience/engine/ScrollytellingProvider';
import { Preloader } from '@about-experience/components/Preloader';
import { ScrollProgress } from '@about-experience/components/ScrollProgress';
import { HeroSection } from '@about-experience/sections/HeroSection';
import { ProblemSection } from '@about-experience/sections/ProblemSection';
import { ArchitectureSection } from '@about-experience/sections/ArchitectureSection';
import { MLSection } from '@about-experience/sections/MLSection';
import { CompetitiveSection } from '@about-experience/sections/CompetitiveSection';
import { TechStackSection } from '@about-experience/sections/TechStackSection';
import { BenchmarksSection } from '@about-experience/sections/BenchmarksSection';
import { CTASection } from '@about-experience/sections/CTASection';

export default function AboutPage() {
  return (
    <ScrollytellingProvider>
      <Preloader />
      <ScrollProgress />
      <main>
        <HeroSection />
        <ProblemSection />
        <ArchitectureSection />
        <MLSection />
        <CompetitiveSection />
        <TechStackSection />
        <BenchmarksSection />
        <CTASection />
      </main>
    </ScrollytellingProvider>
  );
}