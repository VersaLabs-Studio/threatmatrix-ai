'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { AuthGuardWrapper } from "@/components/auth/AuthGuardWrapper";
import { MaintenanceBanner } from "@/components/shared/MaintenanceBanner";
import { PageTransition } from "@/components/shared/PageTransition";
import { useWebSocket } from "@/hooks/useWebSocket";

const SIDEBAR_COLLAPSED_KEY = 'tm_sidebar_collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  useWebSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate sidebar collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    } catch {
      // localStorage unavailable (SSR, incognito, etc.)
    }
  }, []);

  // Persist sidebar collapsed state
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Update CSS variable for sidebar width so main-content shifts
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty(
      '--sidebar-active-width',
      sidebarCollapsed ? '64px' : 'var(--sidebar-width)'
    );
  }, [sidebarCollapsed, mounted]);

  return (
    <>
      <div className="bg-mesh" />
      <MaintenanceBanner />
      <div
        className="app-shell"
        style={{
          gridTemplateColumns: `${sidebarCollapsed ? '64px' : 'var(--sidebar-width)'} 1fr`,
          transition: 'grid-template-columns 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* Column 1 — Sidebar spans all rows */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} collapsed={sidebarCollapsed} />

        {/* Column 2, Row 1 — Top bar */}
        <TopBar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapse}
        />

        {/* Column 2, Row 2 — Main scrollable content */}
        <main className="main-content">
          <AuthGuardWrapper>
            <PageTransition>{children}</PageTransition>
          </AuthGuardWrapper>
        </main>

        {/* Column 2, Row 3 — Status bar */}
        <StatusBar />
      </div>

      {/* Critical Alert Full-Screen Overlay disabled */}
      {/* <CriticalOverlay visible={showCriticalOverlay} category={criticalInfo.category} srcIp={criticalInfo.srcIp} /> */}
    </>
  );
}
