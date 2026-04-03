'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — SystemStatusCard
// Displays real-time backend component status
// ═══════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { api } from '@/lib/api';
import { 
  Activity, Database, Cpu, Radio, Shield, BrainCircuit, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, XCircle 
} from 'lucide-react';

interface ComponentStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'stopped' | 'idle';
  icon: React.ReactNode;
  detail?: string;
  metric?: string;
}

interface HealthResponse {
  status: string;
  components: {
    api: string;
    database: string | { status: string };
    redis: { status: string; latency_ms: number };
    capture_engine: string;
    ml_worker: string;
  };
}

interface CaptureStatus {
  status: string;
  packets_captured: number;
  flows_completed: number;
  flows_published: number;
}

export function SystemStatusCard() {
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [captureStats, setCaptureStats] = useState<CaptureStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [healthRes, captureRes] = await Promise.allSettled([
        api.get<HealthResponse>('/api/v1/system/health'),
        api.get<CaptureStatus>('/api/v1/capture/status'),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.data) {
        const c = healthRes.value.data.components;
        const dbStatus = typeof c.database === 'string' ? c.database : c.database?.status;
        
        setComponents([
          {
            name: 'API Gateway',
            status: c.api === 'healthy' ? 'healthy' : 'degraded',
            icon: <Radio size={14} />,
            detail: c.api,
          },
          {
            name: 'PostgreSQL',
            status: dbStatus === 'healthy' || dbStatus === 'connected' ? 'healthy' : dbStatus === 'pending' ? 'degraded' : 'stopped',
            icon: <Database size={14} />,
            detail: dbStatus,
          },
          {
            name: 'Redis',
            status: c.redis?.status === 'healthy' ? 'healthy' : 'degraded',
            icon: <Cpu size={14} />,
            detail: `${c.redis?.latency_ms ?? 0}ms latency`,
          },
          {
            name: 'Capture Engine',
            status: c.capture_engine === 'active' || c.capture_engine === 'running' ? 'healthy' : 'idle',
            icon: <Activity size={14} />,
            detail: c.capture_engine,
          },
          {
            name: 'ML Worker',
            status: c.ml_worker === 'active' || c.ml_worker === 'running' ? 'healthy' : 'idle',
            icon: <BrainCircuit size={14} />,
            detail: c.ml_worker,
          },
        ]);
      }

      if (captureRes.status === 'fulfilled' && captureRes.value.data) {
        setCaptureStats(captureRes.value.data);
      }
    } catch (e) {
      console.error('[SystemStatus] Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 size={12} style={{ color: 'var(--safe)' }} />;
      case 'degraded':
        return <AlertCircle size={12} style={{ color: 'var(--warning)' }} />;
      case 'stopped':
        return <XCircle size={12} style={{ color: 'var(--critical)' }} />;
      default:
        return <AlertCircle size={12} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const healthyCount = components.filter(c => c.status === 'healthy').length;
  const totalCount = components.length;

  return (
    <GlassPanel
      icon="🛡️"
      title="SYSTEM STATUS"
      badge={`${healthyCount}/${totalCount} operational`}
      style={{ height: '100%' }}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Loading system status...
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {components.map((comp) => (
            <div
              key={comp.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Status icon */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 20, 
                height: 20,
                borderRadius: '50%',
                background: comp.status === 'healthy' ? 'var(--safe-dim)' : 
                           comp.status === 'degraded' ? 'var(--warning-dim)' : 'var(--critical-dim)',
                flexShrink: 0,
              }}>
                {getStatusIcon(comp.status)}
              </div>

              {/* Component icon */}
              <div style={{ 
                color: comp.status === 'healthy' ? 'var(--cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {comp.icon}
              </div>

              {/* Name and detail */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontFamily: 'var(--font-data)', 
                  fontSize: '0.6rem', 
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {comp.name}
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-data)', 
                  fontSize: '0.55rem', 
                  color: 'var(--text-muted)',
                }}>
                  {comp.detail}
                </div>
              </div>

              {/* Status badge */}
              <span style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.5rem',
                fontWeight: 600,
                color: comp.status === 'healthy' ? 'var(--safe)' : 
                       comp.status === 'degraded' ? 'var(--warning)' : 'var(--critical)',
                background: comp.status === 'healthy' ? 'var(--safe-dim)' : 
                           comp.status === 'degraded' ? 'var(--warning-dim)' : 'var(--critical-dim)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
              }}>
                {comp.status}
              </span>
            </div>
          ))}

          {/* Capture stats footer */}
          {captureStats && captureStats.status !== 'stopped' && (
            <div style={{
              marginTop: 4,
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--cyan-muted)',
              border: '1px solid var(--cyan-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <ArrowUpRight size={12} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'var(--cyan)' }}>
                {captureStats.flows_completed.toLocaleString()} flows · {captureStats.packets_captured.toLocaleString()} pkts
              </span>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
