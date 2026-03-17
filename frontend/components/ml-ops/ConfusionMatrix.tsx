'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ConfusionMatrix
// Colored intensity heatmap for actual vs predicted results
// ═══════════════════════════════════════════════════════

export function ConfusionMatrix() {
  const data = [
    { actual: 'NORMAL', pred: [85240, 160] },
    { actual: 'ANOMALY', pred: [42, 1558] },
  ];

  return (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 150px 150px', gap: 4, fontFamily: 'var(--font-data)', fontSize: '0.7rem' }}>
        
        {/* Top Header */}
        <div />
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>PRED NORMAL</div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>PRED ANOMALY</div>

        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>ACTUAL NORMAL</div>
        <MatrixCell count={data[0].pred[0]} intensity={0.9} />
        <MatrixCell count={data[0].pred[1]} intensity={0.1} />

        {/* Row 2 */}
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>ACTUAL ANOMALY</div>
        <MatrixCell count={data[1].pred[0]} intensity={0.05} />
        <MatrixCell count={data[1].pred[1]} intensity={0.8} />
      </div>

      <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-8)', fontSize: '0.65rem', fontFamily: 'var(--font-data)', color: 'var(--text-muted)' }}>
        <div>ACCR: <span style={{ color: 'var(--cyan)' }}>99.76%</span></div>
        <div>PREC: <span style={{ color: 'var(--cyan)' }}>90.68%</span></div>
        <div>RECALL: <span style={{ color: 'var(--cyan)' }}>97.37%</span></div>
      </div>
    </div>
  );
}

function MatrixCell({ count, intensity }: { count: number, intensity: number }) {
  return (
    <div style={{
      height: 80,
      background: `rgba(0, 255, 255, ${intensity * 0.4})`,
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-primary)',
      fontSize: '1rem',
      fontWeight: 800,
      borderRadius: 'var(--radius-sm)',
    }}>
      {count.toLocaleString()}
    </div>
  );
}
