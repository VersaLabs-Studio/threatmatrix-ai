'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Page (Live LLM)
// LLM-powered threat analysis interface
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Send, AlertTriangle, Shield, Activity, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useLLM, type ChatMessage } from '@/hooks/useLLM';
import { API_BASE_URL } from '@/lib/constants';
import { api } from '@/lib/api';

export default function AIAnalystPage() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get('alert_id') || searchParams.get('alert');
  const { messages, isStreaming, error, tokenBudget, sendMessage, clearMessages } = useLLM();
  const [input, setInput] = useState('');
  const [alertContext, setAlertContext] = useState<any>(null);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch alert context if alert_id is present
  useEffect(() => {
    if (alertId && !alertContext) {
      api.get<any>(`/api/v1/alerts/${alertId}`).then(({ data }) => {
        if (data) {
          setAlertContext(data);
          // Auto-send analysis request if alert has ai_narrative
          if (data.ai_narrative && !initialMessageSent) {
            setInitialMessageSent(true);
            sendMessage(
              `Analyze alert #${alertId.slice(-8).toUpperCase()}. Category: ${data.category || 'Unknown'}. Severity: ${data.severity}. Source IP: ${data.source_ip || 'N/A'}. ML Score: ${((data.composite_score || 0) * 100).toFixed(0)}%. Provide a detailed threat analysis.`,
              { alert_id: alertId }
            );
          }
        }
      });
    }
  }, [alertId, alertContext, initialMessageSent, sendMessage]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    setInput('');
    await sendMessage(userMessage, alertContext ? { alert_id: alertId } : undefined);
  };

  // Fetch LLM budget info
  const [budget, setBudget] = useState<any>(null);
  useEffect(() => {
    api.get<any>('/api/v1/llm/budget').then(({ data }) => {
      if (data) setBudget(data);
    });
  }, []);

  return (
    <AuthGuard>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 180px)',
        gap: 'var(--space-4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cyan), var(--safe))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={20} style={{ color: 'var(--bg-dark)' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--cyan)',
                letterSpacing: '0.12em',
                margin: 0,
              }}>
                AI ANALYST
              </h1>
              <p style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                margin: 0,
              }}>
                LLM-powered threat investigation • {alertContext ? `Analyzing alert #${alertId?.slice(-8).toUpperCase()}` : 'ML context enabled'}
              </p>
            </div>
          </div>
          {/* Budget Widget */}
          {budget && (
            <div style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textAlign: 'right',
            }}>
              <div>AI Requests: {budget.stats?.requests ?? 0}</div>
              <div>Tokens: {budget.stats?.tokens_in ?? 0} in / {budget.stats?.tokens_out ?? 0} out</div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <GlassPanel static style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}>
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: msg.role === 'user' 
                    ? 'var(--cyan)' 
                    : 'var(--bg-tertiary)',
                  color: msg.role === 'user' ? 'var(--bg-dark)' : 'var(--text-primary)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      marginBottom: 8,
                      opacity: 0.7 
                    }}>
                      <Bot size={12} />
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        AI Analyst
                      </span>
                    </div>
                  )}
                  {msg.content}
                  {msg.isStreaming && (
                    <span style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1em',
                      background: 'var(--cyan)',
                      marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 1s step-end infinite',
                    }} />
                  )}
                </div>
              </div>
            ))}
            
            {error && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.8rem',
                  color: 'var(--critical)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bot size={12} />
                    <span>Connection error — check API status</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 'var(--space-3)',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about threats, anomalies, or alerts..."
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontFamily: 'var(--font-data)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                background: input.trim() && !isStreaming ? 'var(--cyan)' : 'var(--bg-tertiary)',
                color: input.trim() && !isStreaming ? 'var(--bg-dark)' : 'var(--text-muted)',
                border: 'none',
                cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-data)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <Send size={14} />
              Send
            </button>
          </div>
        </GlassPanel>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {[
            { icon: AlertTriangle, label: 'Analyze Top Threat', color: 'var(--critical)' },
            { icon: Shield, label: 'Check IP Reputation', color: 'var(--warning)' },
            { icon: Activity, label: 'Model Performance', color: 'var(--cyan)' },
            { icon: Clock, label: 'Recent Anomalies', color: 'var(--safe)' },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(`Tell me about: ${action.label.toLowerCase()}`)}
              style={{
                flex: 1,
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'var(--font-data)',
                fontSize: '0.7rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.color = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}