'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ROCCurve
// Multiline chart comparing model ROC curves
// ═══════════════════════════════════════════════════════

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MOCK_ROC_DATA } from '@/lib/mock-data';

export function ROCCurve() {
  return (
    <div style={{ height: 300, width: '100%', padding: '10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={MOCK_ROC_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="x" 
            type="number" 
            label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 10 }}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <YAxis 
            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-data)' }}
            itemStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontFamily: 'var(--font-data)', fontSize: 10 }} />
          <Line type="monotone" dataKey="AE" name="AutoEncoder (AUC: 0.96)" stroke="var(--cyan)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="RF" name="Random Forest (AUC: 0.94)" stroke="var(--warning)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="IF" name="Isolation Forest (AUC: 0.91)" stroke="var(--critical)" strokeWidth={2} dot={false} />
          {/* Baseline diagonal */}
          <Line type="linear" dataKey="x" name="Baseline" stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" dot={false} strokeWidth={1} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
