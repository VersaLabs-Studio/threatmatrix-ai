// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — WebSocket Singleton Client
// Manages a single connection with auto-reconnect
// ═══════════════════════════════════════════════════════

import { WS_BASE_URL, WS_CHANNELS } from './constants';

type WSChannel = (typeof WS_CHANNELS)[keyof typeof WS_CHANNELS];
type Listener = (data: unknown) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<WSChannel, Set<Listener>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxDelay = 30_000;
  private shouldConnect = false;

  connect(token: string) {
    this.shouldConnect = true;
    this.reconnectDelay = 1000;
    this._open(token);
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(channel: WSChannel, listener: Listener) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);
    return () => this.listeners.get(channel)?.delete(listener);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private _open(token: string) {
    if (this.ws) this.ws.close();

    const url = `${WS_BASE_URL}/ws/?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      console.log('[ThreatMatrix WS] Connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as { channel: WSChannel; data: unknown };
        const channelListeners = this.listeners.get(msg.channel);
        if (channelListeners) {
          channelListeners.forEach((fn) => fn(msg.data));
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (!this.shouldConnect) return;
      console.log(`[ThreatMatrix WS] Reconnecting in ${this.reconnectDelay}ms…`);
      this.reconnectTimer = setTimeout(() => {
        this._open(token);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
      }, this.reconnectDelay);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }
}

// Singleton — one connection for the whole app
export const wsClient = new WebSocketClient();
