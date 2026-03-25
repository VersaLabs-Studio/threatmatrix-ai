'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — LiveAlertFeed
// Real-time scrolling alert ticker
// Source: WebSocket alerts:live channel
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { SEVERITY_COLORS, type Severity } from '@/lib/constants';
import { formatTime } from '@/lib/utils';
import type { AlertEvent } from '@/hooks/useWebSocket';

interface AlertFeedItem {
  id: string;
  severity: Severity;
  category: string;
  src_ip: string;
  timestamp: string;
  composite_score?: number;
  isNew?: boolean;
}

interface LiveAlertFeedProps {
  lastAlertEvent: AlertEvent | null;
}

const SEVERITY_ICONS: Record<Severity, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🔵',
  info:     '⚪',
};

// Seed mock alerts for demo purposes
const SEED_ALERTS: AlertFeedItem[] = [
  { id: 'seed-1', severity: 'critical', category: 'DDoS Detected',     src_ip: '45.33.32.156', timestamp: new Date(Date.now() - 45000).toISOString() },
  { id: 'seed-2', severity: 'high',     category: 'Port Scan',         src_ip: '192.168.1.15', timestamp: new Date(Date.now() - 90000).toISOString() },
  { id: 'seed-3', severity: 'medium',   category: 'Suspicious DNS',    src_ip: '10.0.1.23',    timestamp: new Date(Date.now() - 130000).toISOString() },
  { id: 'seed-4', severity: 'high',     category: 'C2 Communication',  src_ip: '104.21.55.12', timestamp: new Date(Date.now() - 180000).toISOString() },
  { id: 'seed-5', severity: 'low',      category: 'Unusual Port',      src_ip: '172.16.0.5',   timestamp: new Date(Date.now() - 240000).toISOString() },
  { id: 'seed-6', severity: 'critical', category: 'Brute Force',       src_ip: '185.220.101.4',timestamp: new Date(Date.now() - 320000).toISOString() },
];

const MAX_FEED_SIZE = 50;

export function LiveAlertFeed({ lastAlertEvent }: LiveAlertFeedProps) {
  const [alerts, setAlerts] = useState<AlertFeedItem[]>(SEED_ALERTS);
  const listRef = useRef<HTMLDivElement>(null);

  // Ingest new WebSocket alert events
  useEffect(() => {
    if (!lastAlertEvent) return;
    const newItem: AlertFeedItem = {
      id:        lastAlertEvent.id,
      severity:  lastAlertEvent.severity as Severity,
      category:  lastAlertEvent.category,
      src_ip:    lastAlertEvent.src_ip,
      timestamp: lastAlertEvent.timestamp,
      composite_score: lastAlertEvent.composite_score,
      isNew:     true,
    };
    setAlerts((prev) => [newItem, ...prev].slice(0, MAX_FEED_SIZE));

    // Remove isNew flag after animation
    setTimeout(() => {
      setAlerts((prev) => prev.map((a) => a.id === newItem.id ? { ...a, isNew: false } : a));
    }, 1000);
  }, [lastAlertEvent]);

  // Auto-scroll to top when new alert arrives
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [alerts.length]);

  return (
    <GlassPanel icon="🚨" title="LIVE ALERT FEED" badge={`${alerts.length}`} style={{ height: '100%' }}>
      <div
        ref={listRef}
        style={{
          overflowY: 'auto',
          maxHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          paddingRight: 4,
        }}
      >
        {alerts.map((alert, idx) => (
          <div
            key={alert.id}
            className={alert.severity === 'critical' ? 'alert-card alert-card--critical' : 'alert-card'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: `1px solid ${alert.isNew ? SEVERITY_COLORS[alert.severity] + '66' : 'var(--border)'}`,
              backdropFilter: 'blur(4px)',
              transition: 'border-color 0.4s ease, background 0.4s ease, opacity 0.4s ease, filter 0.4s ease',
              animation: alert.isNew ? `stagger-in 0.3s ease forwards` : undefined,
              animationDelay: alert.isNew ? `${idx * 50}ms` : undefined,
              opacity: alert.isNew ? 0 : (idx > alerts.length - 3 ? 0.4 : 1), // Ghosting effect for older items
              filter: idx > alerts.length - 3 ? 'grayscale(0.5)' : 'none',
            }}
          >
            <span style={{ fontSize: '0.7rem' }}>{SEVERITY_ICONS[alert.severity]}</span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                flexShrink: 0,
                width: '5.5rem',
              }}
            >
              {formatTime(alert.timestamp)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.72rem',
                color: SEVERITY_COLORS[alert.severity],
                fontWeight: 600,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {alert.category}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {alert.src_ip}
            </span>
            {alert.composite_score !== undefined && (
              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.6rem',
                  color: 'var(--cyan)',
                  flexShrink: 0,
                  width: '2.5rem',
                  textAlign: 'right',
                }}
              >
                {(alert.composite_score * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>

      <Link
        href="/alerts"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 'var(--space-3)',
          fontFamily: 'var(--font-data)',
          fontSize: 'var(--text-xs)',
          color: 'var(--cyan)',
          textDecoration: 'none',
          opacity: 0.7,
        }}
      >
        View All Alerts →
      </Link>
    </GlassPanel>
  );
}
