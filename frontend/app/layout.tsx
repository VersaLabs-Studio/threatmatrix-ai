import type { Metadata } from "next";
import "./globals.css";
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";
import { AuthGuardWrapper } from "@/components/auth/AuthGuardWrapper";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
