// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — About Layout
// Overrides root shell (no Sidebar/TopBar/StatusBar)
// Full-viewport standalone cinematic experience
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'auto',
        isolation: 'isolate',
        background: '#000',
      }}
    >
      {children}
    </div>
  );
}