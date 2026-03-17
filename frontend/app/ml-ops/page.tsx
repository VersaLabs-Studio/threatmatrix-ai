'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ML Operations Page
// Model registry, performance metrics, and retraining controls
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';
import { ModelComparison } from '@/components/ml-ops/ModelComparison';
import { ConfusionMatrix } from '@/components/ml-ops/ConfusionMatrix';
import { ROCCurve }        from '@/components/ml-ops/ROCCurve';
import { DataTable }       from '@/components/shared/DataTable';
import { MOCK_ML_MODELS }  from '@/lib/mock-data';
import { Brain, TrendingUp, Settings2, BarChart, Activity, Zap } from 'lucide-react';

export default function MLOpsPage() {

  const REGISTRY_COLUMNS = [
    { key: 'name',    header: 'MODEL NAME', width: 220, render: (r: any) => <span style={{ fontWeight: 600, color: 'var(--cyan)' }}>{r.name}</span> },
    { key: 'version', header: 'VER',       width: 70 },
    { key: 'type',    header: 'TYPE',      width: 120, render: (r: any) => <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>{r.type}</span> },
    { key: 'accuracy', header: 'ACCURACY', width: 100, render: (r: any) => (
      <span style={{ color: r.accuracy > 0.9 ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
        {(r.accuracy * 100).toFixed(1)}%
      </span>
    )},
    { key: 'status',   header: 'STATUS',   width: 100, render: (r: any) => (
      <span style={{ 
        fontSize: '0.6rem', 
        color: r.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
        textTransform: 'uppercase',
        fontWeight: 700 
      }}>
        {r.status}
      </span>
    )},
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
          ML OPERATIONS
        </h1>
      </header>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.2rem' }}>🧠</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
                ML OPERATIONS & MODEL OPS
              </h1>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                Production Inference Monitoring · Model Drift · Retraining
              </p>
            </div>
          </div>

          <button style={{
            background: 'var(--cyan)',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-data)',
            fontSize: '0.7rem',
            fontWeight: 800,
            color: 'var(--bg-dark)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <TrendingUp size={14} /> TRIGGER RETRAINING
          </button>
        </div>

        {/* Inference Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          <MLMetric icon={<Activity size={18} />} label="AVG INFERENCE" value="1.5ms" />
          <MLMetric icon={<Zap size={18} />}      label="DAILY PREDICTIONS" value="12.4M" />
          <MLMetric icon={<BarChart size={18} />} label="TRUE POSITIVE RATE" value="97.4%" />
          <MLMetric icon={<Settings2 size={18} />} label="MODELS IN PROD" value="2 / 8" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-4)', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <GlassPanel static icon="🗂️" title="MODEL REGISTRY">
              <DataTable 
                columns={REGISTRY_COLUMNS}
                data={MOCK_ML_MODELS}
                rowKey={(r) => r.id}
                maxHeight={200}
              />
            </GlassPanel>
            <GlassPanel static icon="⚔️" title="MODEL COMPARISON GRID">
              <ModelComparison />
            </GlassPanel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <GlassPanel static icon="💠" title="CONFUSION MATRIX (ACTIVE CHAMPION)">
              <ConfusionMatrix />
            </GlassPanel>
            <GlassPanel static icon="📈" title="ROC CURVE ANALYSIS">
              <ROCCurve />
            </GlassPanel>
          </div>
      </div>
    </div>
  );
}

function MLMetric({ icon, label, value }: any) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ color: 'var(--cyan)', opacity: 0.8 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-data)' }}>{value}</div>
      </div>
    </div>
  );
}
