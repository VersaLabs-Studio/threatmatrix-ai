// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Global Constants
// ═══════════════════════════════════════════════════════

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SystemStatus = 'live' | 'idle' | 'offline' | 'warning';
export type ThreatLevel = 'SAFE' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
export type UserRole = 'admin' | 'soc_manager' | 'analyst' | 'viewer';

// ── Severity color map ─────────────────────────────────
export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'hsl(0, 72%, 56%)',
  high:     'hsl(25, 90%, 55%)',
  medium:   'hsl(40, 92%, 56%)',
  low:      'hsl(217, 80%, 60%)',
  info:     'hsl(195, 85%, 58%)', // Matching --info in css roughly, but usually info is a bit less loud. We match the CSS: info is 217 80% 60% and cyan is 195 85% 58%. Let's match CSS exactly.
};
// Re-assigning precisely to CSS equivalent:
export const SEVERITY_COLORS_EXACT: Record<Severity, string> = {
  critical: 'hsl(0, 72%, 56%)',
  high:     'hsl(25, 90%, 55%)',
  medium:   'hsl(40, 92%, 56%)',
  low:      'hsl(217, 80%, 60%)',
  info:     'hsl(217, 10%, 60%)', // info uses --text-muted or similar in some places
};

export const SEVERITY_CSS_VARS: Record<Severity, string> = {
  critical: 'var(--critical)',
  high:     'var(--high)',
  medium:   'var(--warning)',
  low:      'var(--info)',
  info:     'var(--text-muted)',
};

export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  SAFE:     'hsl(152, 60%, 48%)',
  GUARDED:  'hsl(217, 80%, 60%)',
  ELEVATED: 'hsl(40, 92%, 56%)',
  HIGH:     'hsl(25, 90%, 55%)',
  CRITICAL: 'hsl(0, 72%, 56%)',
};

// ── API polling intervals (ms) ─────────────────────────
export const REFRESH_INTERVALS = {
  metrics:    3_000,
  charts:     5_000,
  protocols:  10_000,
  topTalkers: 10_000,
  geo:        30_000,
  briefing:   300_000, // 5 minutes
} as const;

// ── WebSocket channels ─────────────────────────────────
export const WS_CHANNELS = {
  FLOWS:  'flows:live',
  ALERTS: 'alerts:live',
  SYSTEM: 'system:status',
  ML:     'ml:live',
} as const;

// ── Navigation items ───────────────────────────────────
export const NAV_ITEMS = [
  { icon: 'Target',       label: 'War Room',       href: '/war-room',   shortcut: 'Alt+1' },
  { icon: 'Search',       label: 'Threat Hunt',    href: '/hunt',       shortcut: 'Alt+2' },
  { icon: 'Shield',       label: 'Intel Hub',      href: '/intel',      shortcut: 'Alt+3' },
  { icon: 'Radio',        label: 'Network Flow',   href: '/network',    shortcut: 'Alt+4' },
  { icon: 'Bot',          label: 'AI Analyst',     href: '/ai-analyst', shortcut: 'Alt+5' },
  { icon: 'Bell',         label: 'Alert Console',  href: '/alerts',     shortcut: 'Alt+6' },
  { icon: 'FlaskConical', label: 'Forensics Lab',  href: '/forensics',  shortcut: 'Alt+7' },
  { icon: 'BrainCircuit', label: 'ML Operations',  href: '/ml-ops',     shortcut: 'Alt+8' },
  { icon: 'BarChart3',    label: 'Reports',        href: '/reports',    shortcut: 'Alt+9' },
  { icon: 'Settings',     label: 'Administration', href: '/admin',      shortcut: 'Alt+0' },
] as const;

// ── API base URL ───────────────────────────────────────
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://187.124.45.161:8000';
export const WS_BASE_URL  = process.env.NEXT_PUBLIC_WS_URL  ?? 'ws://187.124.45.161:8000';
export const APP_VERSION  = 'v0.6.4';
