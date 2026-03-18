'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ML Operations (v0.5.0)
// Model Performance and Training Dashboard
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

import { GlassPanel } from '@/components/shared/GlassPanel';
import { Brain, Activity, Zap, Target } from 'lucide-react';

interface ModelInfo {
  name: string;
  type: string;
  accuracy: number;
  f1: number;
  inference_ms: number;
  status: 'active' | 'training' | 'retired';
  version: string;
}

// Mock ML Models
const MOCK_MODELS: ModelInfo[] = [
  { name: 'Isolation Forest', type: 'Unsupervised', accuracy: 92.3, f1: 0.904, inference_ms: 0.8, status: 'active', version: 'v1.2' },
  { name: 'Random Forest', type: 'Supervised', accuracy: 97.1, f1: 0.971, inference_ms: 1.2, status: 'active', version: 'v2.0' },
  { name: 'Autoencoder', type: 'Deep Learning', accuracy: 94.8, f1: 0.941, inference_ms: 3.5, status: 'active', version: 'v1.1' },
];

const STATUS_COLORS = {
  active: 'var(--safe)',
  training: 'var(--warning)',
  retired: 'var(--text-muted)',
};

export default function MLOpsPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
          ML Operations
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
          Model performance monitoring and training management
        </p>
      </div>

      {/* Model Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {MOCK_MODELS.map(model => (
          <GlassPanel key={model.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 4 }}>
                  {model.name}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{model.type} • {model.version}</span>
              </div>
              <span style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                background: `${STATUS_COLORS[model.status]}22`,
                color: STATUS_COLORS[model.status],
              }}>
                {model.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                  <Target size={14} style={{ color: 'var(--cyan)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Accuracy</span>
                </div>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                  {model.accuracy}%
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                  <Activity size={14} style={{ color: 'var(--safe)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>F1 Score</span>
                </div>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                  {model.f1}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                  <Zap size={14} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Inference</span>
                </div>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                  {model.inference_ms}ms
                </span>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Ensemble Configuration */}
      <GlassPanel>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
          <Brain size={18} style={{ marginRight: 8, color: 'var(--cyan)' }} />
          Ensemble Configuration
        </h2>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p>Final Score = <span style={{ color: 'var(--cyan)' }}>0.30</span> × IF_score + <span style={{ color: 'var(--safe)' }}>0.45</span> × RF_confidence + <span style={{ color: 'var(--warning)' }}>0.25</span> × AE_error</p>
          <p style={{ marginTop: 'var(--space-2)' }}>Datasets: NSL-KDD (primary) • CICIDS2017 (validation)</p>
        </div>
      </GlassPanel>
    </div>
  );
}
