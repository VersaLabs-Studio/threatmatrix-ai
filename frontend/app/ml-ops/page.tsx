'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ML Operations (v1.1.0)
// Model Performance and Training Dashboard
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useMLModels } from '@/hooks/useMLModels';
import { mlService } from '@/lib/services';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { api } from '@/lib/api';
import { Brain, Activity, Zap, Target, CheckCircle, Clock, RefreshCw, Grid3X3 } from 'lucide-react';
import type { MLComparisonResponse, MLConfusionMatrixResponse } from '@/lib/types';
import { API_BASE_URL } from '@/lib/constants';
import { ConfusionMatrix } from '@/components/ml/ConfusionMatrix';
import { Modal } from '@/components/shared/Modal';

interface TrainingHistoryEntry {
  id: string;
  name: string;
  model_type: string;
  status: string;
  metrics?: {
    accuracy?: number;
    f1_score?: number;
    precision?: number;
    recall?: number;
    auc_roc?: number;
  };
  training_time?: number;
  trained_at?: string;
}

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
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryEntry[]>([]);
  const [retraining, setRetraining] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [retrainStatus, setRetrainStatus] = useState<string | null>(null);
  const [selectedMatrix, setSelectedMatrix] = useState<MLConfusionMatrixResponse | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  useEffect(() => {
    mlService.getComparison().then(({ data }) => {
      if (data) setComparison(data);
    });
  }, []);

  const fetchTrainingHistory = useCallback(async () => {
    const { data } = await api.get<TrainingHistoryEntry[]>('/api/v1/ml/training-history');
    if (data && Array.isArray(data)) setTrainingHistory(data);
  }, []);

  useEffect(() => {
    void fetchTrainingHistory();
  }, [fetchTrainingHistory]);

  // Poll retrain status if task is active
  useEffect(() => {
    if (!taskId) return;
    const interval = setInterval(async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/ml/retrain/${taskId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setRetrainStatus(data.status);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setRetraining(false);
        }
      } catch {
        clearInterval(interval);
        setRetraining(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [taskId]);

  const triggerRetrain = async () => {
    setRetraining(true);
    setRetrainStatus('starting');
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ml/retrain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          dataset: 'nsl_kdd',
          models: ['isolation_forest', 'random_forest', 'autoencoder'],
        }),
      });
      const data = await res.json();
      setTaskId(data.task_id);
      setRetrainStatus('running');
    } catch {
      setRetraining(false);
      setRetrainStatus('failed');
    }
  };

  const handleViewMatrix = async (modelName: string) => {
    try {
      const { data } = await mlService.getConfusionMatrix(modelName);
      if (data) {
        setSelectedMatrix(data);
        setShowMatrixModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch confusion matrix:', error);
    }
  };

  // Build comparison data for chart
  const chartData = comparison?.models.map(m => ({
    name: MODEL_DISPLAY_NAMES[m.model] || m.model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    Accuracy: ((m?.accuracy ?? 0) * 100).toFixed(1),
    'F1 Score': ((m?.f1_score ?? 0) * 100).toFixed(1),
    'AUC-ROC': ((m?.auc_roc ?? 0) * 100).toFixed(1),
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
        {/* Retrain Button */}
        <button
          onClick={triggerRetrain}
          disabled={retraining}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            background: retraining ? 'var(--bg-tertiary)' : 'var(--cyan)',
            color: retraining ? 'var(--text-muted)' : 'var(--bg-dark)',
            border: 'none',
            cursor: retraining ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-data)',
            fontSize: '0.75rem',
            fontWeight: 700,
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={16} style={{ animation: retraining ? 'spin 1s linear infinite' : 'none' }} />
          {retraining ? `RETRAINING... (${retrainStatus || 'starting'})` : '🔄 RETRAIN MODELS'}
        </button>
        {taskId && (
          <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Task ID: {taskId.slice(0, 8)}...
          </div>
        )}

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
                      {((model.eval_results?.accuracy ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                      <Activity size={12} style={{ color: 'var(--safe)' }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>F1</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {(model.eval_results?.f1_score ?? 0).toFixed(4)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
                      <Zap size={12} style={{ color: 'var(--warning)' }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>AUC</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {(model.eval_results?.auc_roc ?? 0).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* View Matrix Button */}
                {model.trained && (
                  <button
                    onClick={() => void handleViewMatrix(model.name)}
                    style={{
                      marginTop: 'var(--space-3)',
                      width: '100%',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 240, 255, 0.05)',
                      border: '1px solid rgba(0, 240, 255, 0.2)',
                      color: 'var(--cyan)',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-data)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Grid3X3 size={12} />
                    VIEW CONFUSION MATRIX
                  </button>
                )}
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

        {/* Hyperparameter Tuning Results */}
        <GlassPanel static title="MODEL TRAINING HISTORY" icon="🏆">
          {trainingHistory.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(trainingHistory.length, 4)}, 1fr)`, gap: 'var(--space-4)' }}>
              {trainingHistory.map((entry) => {
                const m = entry.metrics;
                return (
                  <div key={entry.id} style={{ textAlign: 'center', background: 'rgba(0,240,255,0.03)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {MODEL_DISPLAY_NAMES[entry.model_type] || entry.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      {m?.accuracy !== undefined && (
                        <div>Accuracy: <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{(m.accuracy * 100).toFixed(1)}%</span></div>
                      )}
                      {m?.f1_score !== undefined && (
                        <div>F1 Score: <span style={{ color: 'var(--safe)', fontWeight: 700 }}>{(m.f1_score * 100).toFixed(2)}%</span></div>
                      )}
                      {m?.auc_roc !== undefined && (
                        <div>AUC-ROC: <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{m.auc_roc.toFixed(4)}</span></div>
                      )}
                    </div>
                    {entry.training_time && (
                      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Train time: {entry.training_time.toFixed(1)}s
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Loading training history from server...
            </div>
          )}
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
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Models Trained</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{trainedCount}/3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Training Time</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {trainingHistory.reduce((sum, e) => sum + (e.training_time || 0), 0).toFixed(1)}s
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Features</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>40 (→ 63 live)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ensemble Weights</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>0.30 / 0.45 / 0.25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Classes</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>5 (Normal, DoS, Probe, R2L, U2R)</span>
            </div>
          </div>
        </GlassPanel>

        {/* Confusion Matrix Modal */}
        {showMatrixModal && selectedMatrix && (
          <Modal
            isOpen={showMatrixModal}
            onClose={() => setShowMatrixModal(false)}
            title={`${MODEL_DISPLAY_NAMES[selectedMatrix.model] || selectedMatrix.model} — Confusion Matrix`}
          >
            <div style={{ padding: 'var(--space-4)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                Comparing predicted labels against actual ground truth (N={selectedMatrix.n_samples} samples). 
                Diagonal values represent correct classifications.
              </p>
              <ConfusionMatrix 
                matrix={selectedMatrix.confusion_matrix} 
                classNames={selectedMatrix.class_names} 
              />
              <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowMatrixModal(false)}
                  className="btn-aether"
                  style={{ padding: '8px 24px' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AuthGuard>
  );
}