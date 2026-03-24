// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Utility Functions
// ═══════════════════════════════════════════════════════

import type { Severity, ThreatLevel } from './constants';

// ── Protocol mapping ─────────────────────────────────────

/** Map protocol number to human-readable name (6=TCP, 17=UDP, 1=ICMP) */
export const PROTOCOL_MAP: Record<number, string> = {
  1: 'ICMP',
  6: 'TCP',
  17: 'UDP',
};

/** Convert protocol number to string, with fallback for unknown */
export function mapProtocolNumber(proto: number): string {
  return PROTOCOL_MAP[proto] ?? `Other(${proto})`;
}

// ── Number formatting ──────────────────────────────────

/** 12847 → "12.8K" | 2_300_000 → "2.3M" */
export function shortNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** 1536 → "1.50 KB" | 2_097_152 → "2.00 MB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576)     return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1_024)         return `${(bytes / 1_024).toFixed(2)} KB`;
  return `${bytes} B`;
}

/** 0.9142 → "91.4%" */
export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

// ── Timestamp formatting ───────────────────────────────

/** ISO string → "14:32:07 UTC" */
export function formatTime(iso: string): string {
  return new Date(iso).toISOString().slice(11, 19) + ' UTC';
}

/** ISO string → "2026-03-11 14:32:07 UTC" */
export function formatTimestamp(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}

/** ISO string → relative: "2 min ago" */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Severity helpers ───────────────────────────────────

/** Returns the CSS class for a severity badge */
export function getSeverityClass(severity: Severity): string {
  return `severity-badge severity-badge--${severity}`;
}

/** Returns the CSS class for a status dot */
export function getStatusDotClass(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: 'status-dot status-dot--critical',
    high:     'status-dot status-dot--warning',
    medium:   'status-dot status-dot--warning',
    low:      'status-dot status-dot--live',
    info:     'status-dot status-dot--idle',
  };
  return map[severity];
}

// ── IP / Network helpers ───────────────────────────────

/** Local/private IP ranges */
export function isPrivateIP(ip: string): boolean {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
}

/** Truncate long IP strings for table display */
export function formatIP(ip: string, maxLen = 15): string {
  return ip.length > maxLen ? ip.slice(0, maxLen - 1) + '…' : ip.padEnd(maxLen, ' ');
}

// ── Threat level helpers ───────────────────────────────

export function getAlertThreatLevel(criticalCount: number, highCount: number): ThreatLevel {
  if (criticalCount > 0)  return 'CRITICAL';
  if (highCount > 5)      return 'HIGH';
  if (highCount > 0)      return 'ELEVATED';
  return 'GUARDED';
}

// ── Class merge utility ────────────────────────────────

/** Simple class name merger (no clsx dependency needed) */
export function cx(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}
