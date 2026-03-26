'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ML Operations (v1.0.0)
// Model Performance and Training Dashboard
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useMLModels } from '@/hooks/useMLModels';
import { mlService } from '@/lib/services';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Brain, Activity, Zap, Target, CheckCircle, Clock } from 'lucide-react';
import type { MLComparisonResponse } from '@/lib/types';

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  isolation_forest: 'Isolation Forest',
  random_forest: 'Random Forest',
  autoencoder: 'Autoencoder',
  ensemble: 'Ensemble (Combined)',
};

const MODEL_TYPES: Record<string, string> = {
  isolation_forest: 'Unsupervised',
  random_forest: 'Supervised',
  autoencoder: 'Deep Learning',
  ensemble: 'Combined',
};

export default function MLOpsPage() {
  const { models, trainedCount, loading, error } = useMLModels();
  const [comparison, setComparison] = useState<MLComparisonResponse | null>(null);

  useEffect(() => {
    mlService.getComparison().then(({ data }) => {
      if (data) setComparison(data);
    });
  }, []);

  // Build comparison data for chart
  const chartData = comparison?.models.map(m => ({
    name: MODEL_DISPLAY_NAMES[m.model] || m.model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    Accuracy: (m.accuracy * 100).toFixed(1),
    'F1 Score': (m.f1_score * 100).toFixed(1),
    'AUC-ROC': (m.auc_roc * 100).toFixed(1),
  })) ?? [];

  return (
    <AuthGuard>
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
            ML OPERATIONS — MODEL PERFORMANCE DASHBOARD
          </h1>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {trainedCount}/3 models trained · Ensemble active · Best: {comparison?.best_accuracy || '—'}
          </p>
        </div>

        {/* Model Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          {models.map(model => {
            const isBest = comparison?.best_accuracy === model.name || comparison?.best_f1 === model.name;
            return (
              <GlassPanel key={model.name} static style={isBest ? { border: '1px solid var(--cyan)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' } : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                      {MODEL_DISPLAY_NAMES[model.name] || model.name}
                    </h3>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {MODEL_TYPES[model.name] || 'Unknown'}
                    </span>
                    {isBest && <span style={{ fontSize: '0.6rem', color: 'var(--cyan)', fontWeight: 600, marginLeft: 4 }}>🏆 BEST</span>}
                  </div>
                  <span style={{
                    fontSize: '0.6rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: model.trained ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: model.trained ? 'var(--safe)' : 'var(--warning)',
                    fontWeight: 700,
                  }}>
                    {model.trained ? '✅ TRAINED' : '⏳ PENDING'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                      <Target size={12} style={{ color: 'var(--cyan)' }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Accuracy</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {(model.eval_results.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                      <Activity size={12} style={{ color: 'var(--safe)' }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>F1</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {model.eval_results.f1_score.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                      <Zap size={12} style={{ color: 'var(--warning)' }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>AUC</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {model.eval_results.auc_roc.toFixed(4)}
                    </span>
                  </div>
                </div>
              </GlassPanel>
            );
          })}

          {/* Ensemble Card */}
          {comparison && (
            <GlassPanel static style={{ border: '1px solid var(--cyan)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                    Ensemble (Combined)
                  </h3>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    Combined
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--cyan)', fontWeight: 600, marginLeft: 4 }}>🏆 BEST</span>
                </div>
                <span style={{
                  fontSize: '0.6rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: 'var(--safe)',
                  fontWeight: 700,
                }}>
                  ✅ ACTIVE
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                    <Target size={12} style={{ color: 'var(--cyan)' }} />
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Accuracy</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {((comparison.models.find(m => m.model === 'ensemble')?.accuracy ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                    <Activity size={12} style={{ color: 'var(--safe)' }} />
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>F1</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {(comparison.models.find(m => m.model === 'ensemble')?.f1_score ?? 0).toFixed(4)}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                    <Zap size={12} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>AUC</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {(comparison.models.find(m => m.model === 'ensemble')?.auc_roc ?? 0).toFixed(4)}
                  </span>
                </div>
              </div>
            </GlassPanel>
          )}
        </div>

        {/* Ensemble Configuration */}
        <GlassPanel static>
          <h2 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={18} />
            ENSEMBLE CONFIGURATION
          </h2>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>Final Score = <span style={{ color: 'var(--cyan)' }}>0.30</span> × IF_score + <span style={{ color: 'var(--safe)' }}>0.45</span> × RF_confidence + <span style={{ color: 'var(--warning)' }}>0.25</span> × AE_error</p>
            <p style={{ marginTop: 'var(--space-2)' }}>Alert Thresholds: ≥0.90 CRITICAL · ≥0.75 HIGH · ≥0.50 MEDIUM · ≥0.30 LOW</p>
            <p style={{ marginTop: 'var(--space-2)' }}>Datasets: NSL-KDD (125,973 train / 22,544 test) · 40 features · 5 classes</p>
          </div>
        </GlassPanel>

        {/* Training Config */}
        <GlassPanel static>
          <h2 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} />
            TRAINING CONFIGURATION
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dataset</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>NSL-KDD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Training Time</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>114.1s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Train Samples</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>125,973</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Test Samples</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>22,544</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Features</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>40 (→ 63 live)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Classes</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>5 (Normal, DoS, Probe, R2L, U2R)</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AuthGuard>
  );
}