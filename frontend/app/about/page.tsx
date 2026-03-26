'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — About Page
// Cinematic standalone experience
// ═══════════════════════════════════════════════════════

import React from 'react';
import { ScrollytellingProvider } from '../../../packages/about-experience/engine/ScrollytellingProvider';
import { Preloader } from '../../../packages/about-experience/components/Preloader';
import { ScrollProgress } from '../../../packages/about-experience/components/ScrollProgress';
import { HeroSection } from '../../../packages/about-experience/sections/HeroSection';
import { ProblemSection } from '../../../packages/about-experience/sections/ProblemSection';
import { ArchitectureSection } from '../../../packages/about-experience/sections/ArchitectureSection';
import { MLSection } from '../../../packages/about-experience/sections/MLSection';
import { CompetitiveSection } from '../../../packages/about-experience/sections/CompetitiveSection';
import { TechStackSection } from '../../../packages/about-experience/sections/TechStackSection';
import { BenchmarksSection } from '../../../packages/about-experience/sections/BenchmarksSection';
import { CTASection } from '../../../packages/about-experience/sections/CTASection';

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