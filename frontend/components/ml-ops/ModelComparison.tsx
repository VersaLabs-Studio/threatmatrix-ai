'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ModelComparison
// High-fidelity grid comparing 3 ML models across 10 metrics
// ═══════════════════════════════════════════════════════

import { MOCK_MODEL_COMPARISON } from '@/lib/mock-data';

export function ModelComparison() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table 
        style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontFamily: 'var(--font-data)',
          fontSize: '0.75rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-active)', background: 'rgba(255,255,255,0.03)' }}>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>METRIC</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>AUTOENCODER (AE)</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>RANDOM FOREST (RF)</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>ISOLATION FOREST (IF)</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_MODEL_COMPARISON.map((row) => (
            <tr key={row.metric} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{row.metric.toUpperCase()}</td>
              <Cell value={row.AE} isChampion={row.metric === 'Inference Time (ms)' ? row.AE < row.RF && row.AE < row.IF : row.champion === 'AE'} />
              <Cell value={row.RF} isChampion={row.metric === 'Inference Time (ms)' ? row.RF < row.AE && row.RF < row.IF : row.champion === 'RF'} />
              <Cell value={row.IF} isChampion={row.metric === 'Inference Time (ms)' ? row.IF < row.AE && row.IF < row.RF : row.champion === 'IF'} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, isChampion }: { value: number, isChampion: boolean }) {
  return (
    <td 
      style={{ 
        padding: '10px 12px', 
        textAlign: 'center',
        background: isChampion ? 'rgba(0, 255, 255, 0.05)' : 'none',
        color: isChampion ? 'var(--cyan)' : 'var(--text-primary)',
        fontWeight: isChampion ? 800 : 400,
        position: 'relative'
      }}
    >
      {value}
      {isChampion && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: '6px solid var(--cyan)', borderLeft: '6px solid transparent' }} />
      )}
    </td>
  );
}
