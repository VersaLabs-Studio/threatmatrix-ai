'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Page (Live LLM)
// LLM-powered threat analysis interface
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Send, AlertTriangle, Shield, Activity, Clock, FileText, Globe, Search, Bell } from 'lucide-react';
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
              border: '2px solid rgba(0, 240, 255, 0.2)',
            }}>
              <Bot size={24} style={{ color: 'var(--bg-dark)' }} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--cyan)',
                letterSpacing: '0.15em',
                margin: 0,
                textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
              }}>
                AI ANALYST
              </h1>
              <p style={{
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: '4px 0 0 0',
              }}>
                <span style={{ color: 'var(--cyan-dim)' }}>●</span> LLM-Powered Threat Investigation
                {alertContext && (
                  <span style={{ color: 'var(--safe)', marginLeft: 8 }}>
                    • Analyzing alert #{alertId?.slice(-8).toUpperCase()}
                  </span>
                )}
              </p>
            </div>
          </div>
          {/* Budget Widget */}
          {budget && (
            <div style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              textAlign: 'right',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              minWidth: 140,
            }}>
              <div style={{ color: 'var(--cyan)', fontWeight: 600, marginBottom: 4 }}>BUDGET</div>
              <div>Requests: {budget.stats?.requests ?? 0}</div>
              <div>Tokens: {budget.stats?.tokens_in ?? 0} in / {budget.stats?.tokens_out ?? 0} out</div>
              <div style={{
                marginTop: 4,
                height: 3,
                background: 'var(--bg-primary)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((budget.stats?.tokens_in ?? 0) / 10000 * 100, 100)}%`,
                  background: 'var(--cyan)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <GlassPanel static style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid transparent',
          background: 'linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box, linear-gradient(135deg, var(--cyan-dim), transparent) border-box',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 240, 255, 0.05)',
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            scrollBehavior: 'smooth',
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center',
                opacity: 0.7,
                flexDirection: 'column',
                gap: 12,
              }}>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>🤖</div>
                <div>
                  THREATMATRIX AI ANALYST TERMINAL<br />
                  <span style={{ color: 'var(--cyan-dim)', fontWeight: 600 }}>Awaiting instructions...</span><br />
                  <span style={{ fontSize: '0.8rem', marginTop: 8, display: 'block' }}>
                    Ask about threats, anomalies, or use quick actions below
                  </span>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))'
                      : 'var(--bg-tertiary)',
                    color: msg.role === 'user' ? 'var(--bg-dark)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 12px rgba(0, 240, 255, 0.2)'
                      : '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 8,
                        opacity: 0.8,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--cyan)',
                      }}>
                        <Bot size={12} />
                        <span>AI ANALYST</span>
                      </div>
                    )}
                    {msg.content}
                    {msg.isStreaming && (
                      <span style={{
                        display: 'inline-block',
                        width: 2,
                        height: '1.2em',
                        background: 'var(--cyan)',
                        marginLeft: 2,
                        verticalAlign: 'text-bottom',
                        animation: 'blink 1s step-end infinite',
                        boxShadow: '0 0 8px var(--cyan)',
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}

            {error && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.85rem',
                  color: 'var(--critical)',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bot size={14} />
                    <span style={{ fontWeight: 600 }}>CONNECTION ERROR</span>
                  </div>
                  <div style={{ marginTop: 6, opacity: 0.9 }}>Check API status and network connection</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--cyan-dim)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--cyan)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--cyan-dim)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="Enter your query... (Shift+Enter for new line)"
              rows={3}
              style={{
                flex: 1,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontFamily: 'var(--font-data)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                minHeight: '80px',
                maxHeight: '150px',
                lineHeight: 1.6,
                transition: 'all 0.2s ease',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              style={{
                padding: '12px 20px',
                borderRadius: 'var(--radius-sm)',
                background: input.trim() && !isStreaming
                  ? 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))'
                  : 'var(--bg-tertiary)',
                color: input.trim() && !isStreaming ? 'var(--bg-dark)' : 'var(--text-muted)',
                border: input.trim() && !isStreaming ? 'none' : '1px solid var(--border)',
                cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-data)',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease',
                boxShadow: input.trim() && !isStreaming
                  ? '0 4px 12px rgba(0, 240, 255, 0.3)'
                  : 'none',
                minWidth: 100,
                height: 'fit-content',
              }}
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </GlassPanel>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-3)',
          padding: '0 var(--space-1)',
        }}>
          {[
            { icon: AlertTriangle, label: 'Analyze Top Threat', color: 'var(--critical)', desc: 'Highest severity alert' },
            { icon: Shield, label: 'Check IP Reputation', color: 'var(--warning)', desc: 'External intel lookup' },
            { icon: Activity, label: 'Model Performance', color: 'var(--cyan)', desc: 'ML metrics' },
            { icon: Clock, label: 'Recent Anomalies', color: 'var(--safe)', desc: 'Latest detections' },
            { icon: FileText, label: 'Daily Briefing', color: 'var(--info)', desc: 'Executive summary' },
            { icon: Globe, label: 'Traffic Origins', color: 'var(--high)', desc: 'Geo analysis' },
            { icon: Search, label: 'Threat Hunt', color: 'var(--cyan)', desc: 'Proactive search' },
            { icon: Bell, label: 'Alert Statistics', color: 'var(--warning)', desc: 'Trends & patterns' },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(`Analyze: ${action.label.toLowerCase()}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: 'var(--space-3) var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-data)',
                fontSize: '0.65rem',
                textAlign: 'center',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.color = action.color;
                e.currentTarget.style.background = `${action.color}15`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 16px ${action.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <action.icon size={18} strokeWidth={2} />
              <span style={{ fontWeight: 600, fontSize: '0.7rem', lineHeight: 1.2 }}>{action.label}</span>
              <span style={{ fontSize: '0.55rem', opacity: 0.6, lineHeight: 1.1 }}>{action.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
