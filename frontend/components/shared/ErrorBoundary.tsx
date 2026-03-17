'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Error Boundary (Shared)
// ═══════════════════════════════════════════════════════

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ThreatMatrix Error Context:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 'var(--space-8)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GlassPanel title="THREATMATRIX: CONNECTION ERROR" icon="⚠️">
             <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <ShieldAlert size={48} color="var(--critical)" style={{ marginBottom: 16 }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>MODULAR SUBSYSTEM FAILURE</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400 }}>
                  A critical error occurred within this interface. This may be due to a backend synchronization failure or a malformed dataset.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '8px 24px',
                    color: 'var(--cyan)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '0 auto'
                  }}
                >
                  <RefreshCw size={14} /> RE-INITIALIZE MODULE
                </button>
             </div>
          </GlassPanel>
        </div>
      );
    }

    return this.children ? this.children : null;
  }
}
