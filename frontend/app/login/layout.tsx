// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Login Layout
// Overrides root shell (no Sidebar/TopBar/StatusBar)
// Full-viewport fixed overlay for immersive login experience
// ═══════════════════════════════════════════════════════

export default function LoginLayout({
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
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {children}
    </div>
  );
}
