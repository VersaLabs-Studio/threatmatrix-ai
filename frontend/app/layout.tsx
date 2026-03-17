import type { Metadata } from "next";
import "./globals.css";
import { Sidebar }   from "@/components/layout/Sidebar";
import { TopBar }    from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-mesh" />
        <div className="app-shell">
          <Sidebar />
          <TopBar />
          <main className="main-content">
            {children}
          </main>
          <StatusBar />
        </div>
      </body>
    </html>
  );
}
