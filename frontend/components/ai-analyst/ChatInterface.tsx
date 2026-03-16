'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ChatInterface
// Terminal-style chat history for AI Analyst
// ═══════════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@/hooks/useLLM';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatInterface({ messages, isStreaming }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        minHeight: 0, // Critical for flex overflow
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-xs)',
            textAlign: 'center',
            opacity: 0.6,
          }}
        >
          <div>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>🤖</span>
            THREATMATRIX AI ANALYST TERMINAL<br />
            Awaiting instructions...
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                textAlign: msg.role === 'user' ? 'right' : 'left',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {msg.role === 'user' ? 'Operator' : 'AI Analyst'} • {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: msg.role === 'user' ? 'var(--cyan-muted)' : 'var(--bg-tertiary)',
                border: `1px solid ${msg.role === 'user' ? 'var(--cyan)' : 'var(--border)'}`,
                color: msg.role === 'user' ? 'var(--cyan)' : 'var(--text-primary)',
                fontFamily: msg.role === 'assistant' ? 'var(--font-data)' : 'inherit',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                position: 'relative',
              }}
            >
              {msg.content}
              {msg.isStreaming && (
                <span className="cursor" style={{ marginLeft: 2 }}>_</span>
              )}
            </div>
          </div>
        ))
      )}
      {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
        <div style={{ color: 'var(--cyan)', fontFamily: 'var(--font-data)', fontSize: '0.75rem' }}>
          AI is thinking...
        </div>
      )}
    </div>
  );
}
