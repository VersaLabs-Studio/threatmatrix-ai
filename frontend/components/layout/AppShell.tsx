'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { AuthGuardWrapper } from "@/components/auth/AuthGuardWrapper";
import { NotificationToast, type Toast } from "@/components/shared/NotificationToast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { type Severity } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { lastAlertEvent, lastAnomalyEvent } = useWebSocket();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [toast, ...prev].slice(0, 5));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Create toasts from WebSocket alert events
  useEffect(() => {
    if (!lastAlertEvent) return;
    const toast: Toast = {
      id: `toast-alert-${Date.now()}`,
      severity: lastAlertEvent.severity as Severity,
      title: lastAlertEvent.category?.toUpperCase() || 'ALERT',
      message: `Score: ${((lastAlertEvent.composite_score || 0) * 100).toFixed(0)}% — ${lastAlertEvent.src_ip}`,
    };
    addToast(toast);
  }, [lastAlertEvent, addToast]);

  // Create toasts from WebSocket anomaly events (MEDIUM+ severity only)
  useEffect(() => {
    if (!lastAnomalyEvent) return;
    const score = lastAnomalyEvent.composite_score ?? lastAnomalyEvent.anomaly_score ?? 0;
    // Only show notifications for MEDIUM+ severity (score >= 0.50)
    if (score < 0.50) return;
    
    const severity: Severity = score >= 0.90 ? 'critical' : score >= 0.75 ? 'high' : score >= 0.50 ? 'medium' : 'low';
    const toast: Toast = {
      id: `toast-anomaly-${Date.now()}`,
      severity,
      title: `ML ANOMALY: ${lastAnomalyEvent.label?.toUpperCase() || 'DETECTED'}`,
      message: `Score: ${(score * 100).toFixed(0)}% — ${lastAnomalyEvent.src_ip} → ${lastAnomalyEvent.dst_ip}`,
    };
    addToast(toast);
  }, [lastAnomalyEvent, addToast]);

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