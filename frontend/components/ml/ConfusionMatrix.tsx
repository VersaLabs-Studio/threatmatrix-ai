import React from 'react';

interface ConfusionMatrixProps {
  matrix: number[][];
  classNames: string[];
  title?: string;
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix, classNames, title }) => {
  if (!matrix || matrix.length === 0) return null;

  const total = matrix.flat().reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      {title && (
        <h4 style={{ 
          fontFamily: 'var(--font-data)', 
          fontSize: '0.7rem', 
          color: 'var(--text-muted)', 
          marginBottom: 'var(--space-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </h4>
      )}
      
      <div style={{ position: 'relative', paddingLeft: '80px', paddingTop: '20px' }}>
        {/* Y Axis Label */}
        <div style={{ 
          position: 'absolute', 
          left: 0, 
          top: '50%', 
          transform: 'rotate(-90deg) translateY(-50%)', 
          fontFamily: 'var(--font-data)', 
          fontSize: '0.6rem', 
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>
          ACTUAL
        </div>

        {/* X Axis Label */}
        <div style={{ 
          textAlign: 'center', 
          fontFamily: 'var(--font-data)', 
          fontSize: '0.6rem', 
          color: 'var(--text-muted)',
          fontWeight: 600,
          marginBottom: 10
        }}>
          PREDICTED
        </div>

        {/* Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${classNames.length}, 1fr)`,
          gap: '2px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden'
        }}>
          {matrix.map((row, i) => (
            row.map((val, j) => {
              const intensity = total > 0 ? (val / total) * 10 : 0;
              const isDiagonal = i === j;
              
              return (
                <div 
                  key={`${i}-${j}`}
                  style={{
                    aspectRatio: '1/1',
                    background: isDiagonal 
                      ? `rgba(0, 240, 255, ${0.1 + intensity * 0.9})`
                      : `rgba(239, 68, 68, ${intensity})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    minWidth: 50
                  }}
                >
                  <span style={{ 
                    fontFamily: 'var(--font-data)', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: intensity > 0.5 ? 'var(--bg-dark)' : 'var(--text-primary)'
                  }}>
                    {val}
                  </span>
                  <span style={{ 
                    fontSize: '0.5rem', 
                    color: intensity > 0.5 ? 'rgba(0,0,0,0.5)' : 'var(--text-muted)'
                  }}>
                    {total > 0 ? ((val / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              );
            })
          ))}
        </div>

        {/* X-Axis labels */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${classNames.length}, 1fr)`,
          marginTop: 8
        }}>
          {classNames.map(name => (
            <div key={name} style={{ 
              textAlign: 'center', 
              fontSize: '0.55rem', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {name}
            </div>
          ))}
        </div>

        {/* Y-Axis labels */}
        <div style={{ 
          position: 'absolute', 
          left: 10, 
          top: '40px',
          bottom: '25px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          width: '60px'
        }}>
          {classNames.map(name => (
            <div key={name} style={{ 
              fontSize: '0.55rem', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              textAlign: 'right',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
