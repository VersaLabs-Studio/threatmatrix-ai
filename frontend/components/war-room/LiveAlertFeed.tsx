'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — LiveAlertFeed
// Real-time scrolling alert ticker
// Source: WebSocket alerts:live channel
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { SEVERITY_COLORS, type Severity } from '@/lib/constants';
import { formatTime, relativeTime } from '@/lib/utils';
import type { AlertEvent } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';

interface AlertFeedItem {
  id: string;
  severity: Severity;
  category: string;
  src_ip: string;
  dst_ip?: string;
  timestamp: string;
  composite_score?: number;
  isNew?: boolean;
}

import type { AnomalyDetectedEvent } from '@/hooks/useWebSocket';

interface LiveAlertFeedProps {
  lastAlertEvent: AlertEvent | null;
  lastAnomalyEvent?: AnomalyDetectedEvent | null;
}

// API alert item type
interface ApiAlertItem {
  id: string;
  alert_id: string;
  severity: Severity;
  category: string;
  source_ip: string;
  dest_ip: string;
  confidence: number;
  title: string;
  created_at: string;
  isNew?: boolean;
}

const SEVERITY_ICONS: Record<Severity, string> = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🔵',
  info:     '⚪',
};

// No mock data — feed starts empty and populates from WebSocket events
const INITIAL_ALERTS: AlertFeedItem[] = [];

const MAX_FEED_SIZE = 50;

export function LiveAlertFeed({ lastAlertEvent, lastAnomalyEvent }: LiveAlertFeedProps) {
  const [alerts, setAlerts] = useState<AlertFeedItem[]>(INITIAL_ALERTS);
  const [apiAlerts, setApiAlerts] = useState<ApiAlertItem[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch alerts from API (for DEV_MODE where WebSocket doesn't work)
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await api.get<{ items: ApiAlertItem[]; total: number }>('/api/v1/alerts/?limit=20&page=1');
      console.log('[LiveAlertFeed] API response:', { data, error });
      console.log('[LiveAlertFeed] Items count:', data?.items?.length);
      if (data?.items) {
        console.log('[LiveAlertFeed] First item:', data.items[0]);
        const transformed: AlertFeedItem[] = data.items.map((a) => ({
          id: a.id,
          severity: a.severity,
          category: a.category || 'Unknown',
          src_ip: a.source_ip || 'N/A',
          dst_ip: a.dest_ip || 'N/A',
          timestamp: a.created_at,
          composite_score: a.confidence,
          isNew: false,
        }));
        setApiAlerts(data.items);
        setAlerts(transformed);
        console.log('[LiveAlertFeed] Transformed alerts:', transformed.length);
      }
    } catch (e) {
      console.error('[LiveAlertFeed] Failed to fetch alerts:', e);
    }
  }, []);

  // Initial fetch + polling for live updates
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Ingest new WebSocket alert events (disabled to avoid conflicts with API polling)
  // useEffect(() => {
  //   if (!lastAlertEvent) return;
  //   const newItem: AlertFeedItem = {
  //     id:        lastAlertEvent.id,
  //     severity:  lastAlertEvent.severity,
  //     category:  lastAlertEvent.category,
  //     src_ip:    lastAlertEvent.src_ip,
  //     dst_ip:    lastAlertEvent.dst_ip,
  //     timestamp: lastAlertEvent.timestamp,
  //     composite_score: lastAlertEvent.composite_score,
  //     isNew:     true,
  //   };
  //   setAlerts((prev) => [newItem, ...prev].slice(0, MAX_FEED_SIZE));

  //   // Remove isNew flag after animation
  //   setTimeout(() => {
  //     setAlerts((prev) => prev.map((a) => a.id === newItem.id ? { ...a, isNew: false } : a));
  //   }, 1000);
  // }, [lastAlertEvent]);

  // Ingest new WebSocket anomaly events (disabled to avoid conflicts with API polling)
  // useEffect(() => {
  //   if (!lastAnomalyEvent) return;
  //   const score = lastAnomalyEvent.composite_score ?? lastAnomalyEvent.anomaly_score ?? 0;

  //   const severity: Severity = score >= 0.90 ? 'critical' : score >= 0.75 ? 'high' : score >= 0.50 ? 'medium' : 'low';
  //   // Only show notifications for CRITICAL and HIGH severity
  //   if (severity !== 'critical' && severity !== 'high') return;
  //   const newItem: AlertFeedItem = {
  //     id:        `anomaly-${lastAnomalyEvent.flow_id}-${Date.now()}`,
  //     severity,
  //     category:  `ML: ${lastAnomalyEvent.label || 'Anomaly'}`,
  //     src_ip:    lastAnomalyEvent.src_ip,
  //     dst_ip:    lastAnomalyEvent.dst_ip,
  //     timestamp: lastAnomalyEvent.timestamp || new Date().toISOString(),
  //     composite_score: score,
  //     isNew:     true,
  //   };
  //   setAlerts((prev) => [newItem, ...prev].slice(0, MAX_FEED_SIZE));

  //   // Remove isNew flag after animation
  //   setTimeout(() => {
  //     setAlerts((prev) => prev.map((a) => a.id === newItem.id ? { ...a, isNew: false } : a));
  //   }, 1000);
  // }, [lastAnomalyEvent]);

  // Auto-scroll to top when new alert arrives
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [alerts.length]);

  return (
    <GlassPanel icon="🚨" title="LIVE ALERT FEED" badge={`${alerts.length}`} style={{ height: '100%' }}>
      {alerts.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 120, fontFamily: 'var(--font-data)', fontSize: '0.7rem',
          color: 'var(--text-muted)', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🛡️</div>
            <div>No alerts yet</div>
            <div style={{ fontSize: '0.6rem', marginTop: 4, opacity: 0.7 }}>Run an attack to trigger detection</div>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingRight: 4,
          }}
        >
        {alerts.map((alert, idx) => {
          const severityDot = SEVERITY_ICONS[alert.severity] || '⚪';
          const severityColor = SEVERITY_COLORS[alert.severity] || 'var(--text-muted)';
          
          return (
            <div
              key={`${alert.id}-${idx}`}
              onClick={() => router.push('/alerts')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                borderTop: `1px solid ${alert.isNew ? severityColor + '44' : 'var(--border)'}`,
                borderRight: `1px solid ${alert.isNew ? severityColor + '44' : 'var(--border)'}`,
                borderBottom: `1px solid ${alert.isNew ? severityColor + '44' : 'var(--border)'}`,
                borderLeft: `3px solid ${severityColor}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: idx > 15 ? 0.5 : 1,
              }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'var(--bg-elevated)';
                 e.currentTarget.style.borderTopColor = severityColor + '66';
                 e.currentTarget.style.borderRightColor = severityColor + '66';
                 e.currentTarget.style.borderBottomColor = severityColor + '66';
                 e.currentTarget.style.borderLeftColor = severityColor + '66';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'var(--bg-tertiary)';
                 e.currentTarget.style.borderTopColor = alert.isNew ? severityColor + '44' : 'var(--border)';
                 e.currentTarget.style.borderRightColor = alert.isNew ? severityColor + '44' : 'var(--border)';
                 e.currentTarget.style.borderBottomColor = alert.isNew ? severityColor + '44' : 'var(--border)';
                 e.currentTarget.style.borderLeftColor = severityColor;
               }}
            >
              {/* Severity dot with pulse for critical */}
              <div style={{
                position: 'relative',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  filter: alert.severity === 'critical' ? `drop-shadow(0 0 4px ${severityColor})` : 'none',
                }}>
                  {severityDot}
                </span>
              </div>
              
              {/* Alert content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.65rem',
                      color: severityColor,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {alert.category}
                  </span>
                  {alert.composite_score !== undefined && (
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.55rem',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-primary)',
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {(alert.composite_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.6rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {alert.src_ip}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.5rem' }}>→</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.6rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {alert.dst_ip || '?'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.5rem' }}>•</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {relativeTime(alert.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

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