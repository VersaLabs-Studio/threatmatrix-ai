'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useLLM Hook
// Handles AI Analyst chat with SSE streaming
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/constants';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface UseLLMReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  tokenBudget: { spent: number; total: number } | null;
  sendMessage: (content: string, context?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
}

export function useLLM(): UseLLMReturn {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [tokenBudget, setTokenBudget] = useState<{ spent: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, context?: Record<string, unknown>) => {
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`LLM error: HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;

          try {
            const parsed = JSON.parse(raw) as { token?: string; budget?: { spent: number; total: number } };
            if (parsed.token) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: m.content + parsed.token } : m,
                ),
              );
            }
            if (parsed.budget) setTokenBudget(parsed.budget);
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, isStreaming: false } : m)),
      );
      setIsStreaming(false);
    }
  }, [isStreaming, messages]);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, tokenBudget, sendMessage, clearMessages };
}
