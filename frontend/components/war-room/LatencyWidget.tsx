'use client';

import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useWebSocket } from '@/hooks/useWebSocket';

export function LatencyWidget() {
  const { lastMetricEvent } = useWebSocket();

  const data = useMemo(() => {
    if (!lastMetricEvent) {
      return [
        { name: 'Pre', ms: 0 },
        { name: 'IF', ms: 0 },
        { name: 'RF', ms: 0 },
        { name: 'AE', ms: 0 },
        { name: 'Ens', ms: 0 },
      ];
    }

    return [
      { name: 'Pre', ms: lastMetricEvent.preprocess_ms },
      { name: 'IF',  ms: lastMetricEvent.if_ms },
      { name: 'RF',  ms: lastMetricEvent.rf_ms },
      { name: 'AE',  ms: lastMetricEvent.ae_ms },
      { name: 'Ens', ms: lastMetricEvent.ensemble_ms },
    ];
  }, [lastMetricEvent]);

  const totalMs = lastMetricEvent?.total_ms || 0;

  return (
    <div className="glass-panel" style={{ height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ML Detection Latency
        </h3>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan)' }}>
          {totalMs.toFixed(1)}<span style={{ fontSize: '0.7rem', marginLeft: 2 }}>ms</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem'
              }}
            />
            <Bar dataKey="ms" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 4 ? 'var(--cyan)' : 'var(--info)'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Real-time pipeline performance (Breakdown in ms)
      </div>
    </div>
  );
}
