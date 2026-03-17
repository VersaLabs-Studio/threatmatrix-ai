'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Demo Emitter
// Lightweight pub-sub to coordinate 'Live Breach' simulations
// across independent React hooks.
// ═══════════════════════════════════════════════════════

type DemoEvent = 'ANOMALY_TRIGGERED' | 'ANOMALY_RESOLVED' | 'STATUS_CHANGED';
type Handler = (data?: any) => void;

class DemoEmitter {
  private handlers: Record<string, Handler[]> = {};

  on(event: DemoEvent, handler: Handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
    return () => {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    };
  }

  emit(event: DemoEvent, data?: any) {
    if (!this.handlers[event]) return;
    this.handlers[event].forEach(h => h(data));
  }
}

export const demoEmitter = new DemoEmitter();
