import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
