'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { AuthGuardWrapper } from "@/components/auth/AuthGuardWrapper";
import { NotificationToast, type Toast } from "@/components/shared/NotificationToast";
import { CriticalOverlay } from "@/components/shared/CriticalOverlay";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAudioAlarm } from "@/hooks/useAudioAlarm";
import { PageTransition } from "@/components/shared/PageTransition";
import { type Severity } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { lastAlertEvent, lastAnomalyEvent } = useWebSocket();
  const { playAlarm } = useAudioAlarm();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCriticalOverlay, setShowCriticalOverlay] = useState(false);
  const [criticalInfo, setCriticalInfo] = useState<{ category?: string; srcIp?: string }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [toast, ...prev].slice(0, 3));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Create toasts from WebSocket alert events
  useEffect(() => {
    if (!lastAlertEvent) return;
    const severity = ((lastAlertEvent.severity || 'medium') as string).toLowerCase() as Severity;
    const score = lastAlertEvent.composite_score ?? 0;
    // Only process CRITICAL, HIGH, and MEDIUM severity alerts
    if (severity !== 'critical' && severity !== 'high' && severity !== 'medium') return;
    const toast: Toast = {
      id:        lastAlertEvent.id,
      severity:  lastAlertEvent.severity,
      title:     lastAlertEvent.category?.toUpperCase() || 'ALERT',
      message:   `${lastAlertEvent.src_ip || 'unknown'} → ${lastAlertEvent.dst_ip || 'unknown'} — Score: ${(score * 100).toFixed(0)}%`,
      alertId:   lastAlertEvent.id,
      composite_score: score,
      src_ip:    lastAlertEvent.src_ip,
      dst_ip:    lastAlertEvent.dst_ip,
    };
    addToast(toast);

    // Audio and Visual Alerts
    if (severity === 'critical') {
      playAlarm('critical');
      setCriticalInfo({ category: lastAlertEvent.category, srcIp: lastAlertEvent.src_ip });
      setShowCriticalOverlay(true);
      setTimeout(() => setShowCriticalOverlay(false), 3000);
    } else if (severity === 'high') {
      playAlarm('high');
    }
  }, [lastAlertEvent, addToast, playAlarm]);

  // Create toasts from WebSocket anomaly events (CRITICAL/HIGH severity only)
  useEffect(() => {
    if (!lastAnomalyEvent) return;
    const score = lastAnomalyEvent.composite_score ?? lastAnomalyEvent.anomaly_score ?? 0;

    const severity: Severity = score >= 0.90 ? 'critical' : score >= 0.75 ? 'high' : score >= 0.50 ? 'medium' : 'low';
    // Only show notifications for CRITICAL and HIGH severity
    if (severity !== 'critical' && severity !== 'high') return;
    const toast: Toast = {
      id:        `anomaly-${lastAnomalyEvent.flow_id}-${Date.now()}`,
      severity,
      title:     `ML ANOMALY: ${lastAnomalyEvent.label?.toUpperCase() || 'DETECTED'}`,
      message:   `${lastAnomalyEvent.src_ip || 'unknown'} → ${lastAnomalyEvent.dst_ip || 'unknown'} — Score: ${(score * 100).toFixed(0)}%`,
      composite_score: score,
      if_score:  lastAnomalyEvent.if_score,
      ae_score:  lastAnomalyEvent.ae_score,
      rf_score:  lastAnomalyEvent.rf_confidence,
      model_agreement: lastAnomalyEvent.model_agreement,
      src_ip:    lastAnomalyEvent.src_ip,
      dst_ip:    lastAnomalyEvent.dst_ip,
    };
    addToast(toast);

    // Audio and Visual Alerts
    if (severity === 'critical') {
      playAlarm('critical');
      setCriticalInfo({ category: lastAnomalyEvent.label, srcIp: lastAnomalyEvent.src_ip });
      setShowCriticalOverlay(true);
      setTimeout(() => setShowCriticalOverlay(false), 3000);
    } else if (severity === 'high') {
      playAlarm('high');
    }
  }, [lastAnomalyEvent, addToast, playAlarm]);

  return (
    <>
      <div className="bg-mesh" />
      <div className="app-shell">
        {/* Column 1 — Sidebar spans all rows */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Column 2, Row 1 — Top bar */}
        <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Column 2, Row 2 — Main scrollable content */}
        <main className="main-content">
          <AuthGuardWrapper>
            <PageTransition>{children}</PageTransition>
          </AuthGuardWrapper>
        </main>

        {/* Column 2, Row 3 — Status bar */}
        <StatusBar />
      </div>

      {/* Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />

      {/* Critical Alert Full-Screen Overlay */}
      <CriticalOverlay 
        visible={showCriticalOverlay} 
        category={criticalInfo.category} 
        srcIp={criticalInfo.srcIp} 
      />
    </>
  );
}
