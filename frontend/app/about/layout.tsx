// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — About Layout
// Overrides root shell (no Sidebar/TopBar/StatusBar)
// Full-viewport standalone cinematic experience
//
// ── WHY overflow: overlay ──────────────────────────────
//
//  The root problem on Windows-Chromium (Chrome, Edge, Comet):
//
//  `overflow-y: auto`  → browser allocates 17px scrollbar
//    track at LAYOUT TIME before CSS paint. No CSS rule
//    (display:none, width:0, etc.) can reclaim that space
//    because the allocation already happened.
//
//  `overflow-y: overlay` → browser renders the scrollbar
//    as an OVERLAY on top of content. Zero pixels are
//    ever reserved at layout time. The content fills
//    the full 100vw edge-to-edge.
//
//  `overflow: overlay` is a legacy WebKit/Blink alias that
//  still works in all Chromium-based browsers (Chrome,
//  Edge, Comet, Brave, Arc, Opera, etc.) despite being
//  formally removed from the CSS spec. It is the only
//  CSS-level solution that prevents the 17px reservation
//  without needing JavaScript to measure and compensate.
//
//  The msOverflowStyle/scrollbarWidth inline styles +
//  the .about-scroll-root CSS rules in about.css then
//  hide the overlay scrollbar visually for a clean look.
// ═══════════════════════════════════════════════════════

import type { Metadata } from 'next';
import './about.css';

export const metadata: Metadata = {
  title: 'About — ThreatMatrix AI',
  description:
    'Discover ThreatMatrix AI: AI-Powered Network Anomaly Detection and Cyber Threat Intelligence System. Real-time protection powered by ensemble machine learning.',
  keywords: [
    'cybersecurity',
    'threat detection',
    'network anomaly',
    'machine learning',
    'threat intelligence',
    'AI security',
  ],
  openGraph: {
    title: 'About — ThreatMatrix AI',
    description:
      'AI-Powered Network Anomaly Detection and Cyber Threat Intelligence System',
    type: 'website',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="about-scroll-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflowY: 'auto',
        overflowX: 'hidden',
        isolation: 'isolate',
        background: '#000',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}