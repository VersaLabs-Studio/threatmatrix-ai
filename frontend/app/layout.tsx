'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { AuthGuardWrapper } from "@/components/auth/AuthGuardWrapper";
import { NotificationToast, type Toast } from "@/components/shared/NotificationToast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { type Severity } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ThreatMatrix AI — Command Center",
  description:
    "AI-Powered Network Anomaly Detection and Cyber Threat Intelligence System",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: [
    "cybersecurity",
    "threat detection",
    "network anomaly",
    "machine learning",
    "threat intelligence",
  ],
};

function AppShell({ children }: { children: React.ReactNode }) {
  const { lastAlertEvent } = useWebSocket();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Create toasts from WebSocket alert events
  useEffect(() => {
    if (!lastAlertEvent) return;
    const toast: Toast = {
      id: `toast-${Date.now()}`,
      severity: lastAlertEvent.severity as Severity,
      title: lastAlertEvent.category?.toUpperCase() || 'ALERT',
      message: `Score: ${((lastAlertEvent.composite_score || 0) * 100).toFixed(0)}% — ${lastAlertEvent.src_ip}`,
    };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
  }, [lastAlertEvent]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="app-shell">
        {/* Column 1 — Sidebar spans all rows */}
        <Sidebar />

        {/* Column 2, Row 1 — Top bar */}
        <TopBar />

        {/* Column 2, Row 2 — Main scrollable content */}
        <main className="main-content page-enter">
          <AuthGuardWrapper>{children}</AuthGuardWrapper>
        </main>

        {/* Column 2, Row 3 — Status bar */}
        <StatusBar />
      </div>

      {/* Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
