'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useLLM Hook
// Handles AI Analyst chat with SSE streaming + token tracking
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

export interface TokenUsage {
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  costUsd: number;
  requests: number;
  model: string;
}

interface UseLLMReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  tokenUsage: TokenUsage;
  sendMessage: (content: string, context?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
  loadMessages: (messages: ChatMessage[]) => void;
  resetUsage: () => void;
}

// Estimated cost per 1K tokens for free-tier models (approximate)
const COST_PER_1K_TOKENS = 0.0001; // $0.0001 per 1K tokens (free tier estimate)

export function useLLM(): UseLLMReturn {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    tokensIn: 0,
    tokensOut: 0,
    totalTokens: 0,
    costUsd: 0,
    requests: 0,
    model: 'openai/gpt-oss-120b:free',
  });
  const abortRef = useRef<AbortController | null>(null);
  const sessionTokensRef = useRef({ in: 0, out: 0 });

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
    sessionTokensRef.current = { in: 0, out: 0 };

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
      let responseTokens = 0;

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
            const parsed = JSON.parse(raw) as {
              token?: string;
              budget?: { spent: number; total: number };
              usage?: { prompt_tokens: number; completion_tokens: number };
              model?: string;
            };
            if (parsed.token) {
              responseTokens++;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: m.content + parsed.token } : m,
                ),
              );
            }
            const usage = parsed.usage;
            if (usage) {
              sessionTokensRef.current = {
                in: usage.prompt_tokens,
                out: usage.completion_tokens,
              };
              setTokenUsage((prev) => ({
                tokensIn: prev.tokensIn + usage.prompt_tokens,
                tokensOut: prev.tokensOut + usage.completion_tokens,
                totalTokens: prev.totalTokens + usage.prompt_tokens + usage.completion_tokens,
                costUsd: prev.costUsd + ((usage.prompt_tokens + usage.completion_tokens) / 1000) * COST_PER_1K_TOKENS,
                requests: prev.requests + 1,
                model: parsed.model || prev.model,
              }));
            }
            const budget = parsed.budget;
            if (budget) {
              setTokenUsage((prev) => ({
                ...prev,
                costUsd: budget.spent,
              }));
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Fallback token estimation if no usage data received
      if (sessionTokensRef.current.in === 0) {
        const estimatedIn = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0) + Math.ceil(content.length / 4);
        const estimatedOut = responseTokens;
        setTokenUsage((prev) => ({
          tokensIn: prev.tokensIn + estimatedIn,
          tokensOut: prev.tokensOut + estimatedOut,
          totalTokens: prev.totalTokens + estimatedIn + estimatedOut,
          costUsd: prev.costUsd + ((estimatedIn + estimatedOut) / 1000) * COST_PER_1K_TOKENS,
          requests: prev.requests + 1,
          model: prev.model,
        }));
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

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
    setError(null);
  }, []);

  const resetUsage = useCallback(() => {
    setTokenUsage({
      tokensIn: 0,
      tokensOut: 0,
      totalTokens: 0,
      costUsd: 0,
      requests: 0,
      model: 'openai/gpt-oss-120b:free',
    });
  }, []);

  return { messages, isStreaming, error, tokenUsage, sendMessage, clearMessages, loadMessages, resetUsage };
}
