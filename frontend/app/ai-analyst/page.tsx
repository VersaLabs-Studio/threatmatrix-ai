'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Page (v0.4.0)
// Main interface for interacting with the AI Analyst
// ═══════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { useLLM } from '@/hooks/useLLM';
import { ChatInterface } from '@/components/ai-analyst/ChatInterface';
import { QuickActions }  from '@/components/ai-analyst/QuickActions';
import { ContextPanel }  from '@/components/ai-analyst/ContextPanel';
import { GlassPanel }    from '@/components/shared/GlassPanel';
import { Send, Trash2, Cpu } from 'lucide-react';

export default function AIAnalystPage() {
  const { messages, isStreaming, error, tokenBudget, sendMessage, clearMessages } = useLLM();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput('');
    await sendMessage(content);
  };

  const handleQuickAction = async (prompt: string) => {
    if (isStreaming) return;
    await sendMessage(prompt);
  };

  // Keyboard shortcut: focus input on /
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-4)', padding: 'var(--space-4)', height: 'calc(100vh - 88px)' }}>
      
      {/* ── Left Column: Chat ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
                AI ANALYST TERMINAL
              </h1>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                GPT-4o Intelligence Hub · Active Session
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {tokenBudget && (
              <div 
                style={{ 
                  fontFamily: 'var(--font-data)', 
                  fontSize: '0.65rem', 
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                }}
              >
                <Cpu size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                BUDGET: <span style={{ color: 'var(--cyan)' }}>${tokenBudget.spent.toFixed(2)}</span> / ${tokenBudget.total.toFixed(2)}
              </div>
            )}
            <button
              onClick={clearMessages}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-data)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Clear Console"
            >
              <Trash2 size={12} /> CLEAR
            </button>
          </div>
        </div>

        {/* Chat History */}
        <ChatInterface messages={messages} isStreaming={isStreaming} />

        {/* Input Area */}
        <form 
          onSubmit={handleSend}
          style={{ 
            display: 'flex', 
            gap: 'var(--space-2)', 
            background: 'var(--bg-secondary)', 
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-active)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your command (or press '/' to focus)..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-data)',
              fontSize: '0.85rem',
            }}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            style={{
              background: input.trim() ? 'var(--cyan)' : 'var(--bg-tertiary)',
              color: input.trim() ? 'var(--bg-dark)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={18} />
          </button>
        </form>

        {error && (
          <div style={{ color: 'var(--critical)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-data)' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ── Right Column: Panel ───────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: 320 }}>
        <QuickActions onAction={handleQuickAction} disabled={isStreaming} />
        <ContextPanel context={null} /> {/* Context logic to be tied to LLM state later */}
      </div>
    </div>
  );
}
