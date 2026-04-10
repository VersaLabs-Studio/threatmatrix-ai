'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Page (Live LLM)
// LLM-powered threat analysis with markdown rendering
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, AlertTriangle, Shield, Activity, Clock, FileText, Globe, Search, Bell, Loader2, PanelLeftOpen, History, Coins, Trash2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useLLM, type ChatMessage } from '@/hooks/useLLM';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChatHistorySidebar } from '@/components/ai-analyst/ChatHistorySidebar';
import { api } from '@/lib/api';

// Helper: Create markdown table components with proper row tracking
function createTableComponents(): Components {
  let rowCounter = 0;

  return {
    table: ({ children }) => {
      rowCounter = 0;
      return (
        <div style={{
          overflowX: 'auto',
          margin: '0.75em 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px',
        }}>
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.85em',
          }}>
            {children}
          </table>
        </div>
      );
    },
    thead: ({ children }) => (
      <thead style={{ background: 'hsl(228 24% 8%)' }}>
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th style={{
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 10px',
        textAlign: 'left',
        color: 'hsl(195 85% 58%)',
        fontWeight: 600,
        background: 'hsl(228 24% 8%)',
        borderBottom: '2px solid hsla(195 85% 58% / 0.2)',
      }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 10px',
        textAlign: 'left',
        color: '#f8fafc',
      }}>
        {children}
      </td>
    ),
    tr: ({ children }) => {
      const rowIndex = rowCounter++;
      return (
        <tr style={{
          background: rowIndex % 2 === 0 ? 'rgba(0, 240, 255, 0.04)' : 'transparent',
        }}>
          {children}
        </tr>
      );
    },
  };
}

// Base components (non-table)
const baseComponents: Omit<Components, 'table' | 'thead' | 'th' | 'td' | 'tr'> = {
  p: ({ children }) => (
    <p style={{ marginBottom: '0.6em', lineHeight: 1.6, color: '#f8fafc' }}>
      {children}
    </p>
  ),
  h1: ({ children }) => (
    <h1 style={{
      color: 'hsl(195 85% 58%)',
      fontSize: '1.15em',
      fontWeight: 700,
      marginTop: '1.2em',
      marginBottom: '0.6em',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      paddingBottom: '6px',
    }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{
      color: 'hsl(195 85% 58%)',
      fontSize: '1.05em',
      fontWeight: 700,
      marginTop: '1.2em',
      marginBottom: '0.5em',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      paddingBottom: '4px',
    }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{
      color: 'hsl(195 85% 58%)',
      fontSize: '1em',
      fontWeight: 600,
      marginTop: '1em',
      marginBottom: '0.4em',
    }}>
      {children}
    </h3>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: '0.25em', color: '#f8fafc', lineHeight: 1.5 }}>
      {children}
    </li>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-') || false;
    if (isBlock) {
      return (
        <pre style={{
          background: 'hsl(228 28% 4%)',
          padding: '12px',
          borderRadius: '4px',
          overflowX: 'auto',
          marginBottom: '0.8em',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <code style={{
            background: 'none',
            padding: 0,
            color: 'hsl(195 85% 58%)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.85em',
            lineHeight: 1.5,
          }}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code style={{
        background: 'hsl(228 28% 5%)',
        padding: '2px 6px',
        borderRadius: '3px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.85em',
        color: 'hsl(195 85% 58%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid hsl(195 85% 58%)',
      paddingLeft: '12px',
      margin: '0.75em 0',
      color: '#94a3b8',
      fontStyle: 'italic',
      background: 'rgba(0, 240, 255, 0.03)',
      borderRadius: '0 4px 4px 0',
      padding: '8px 12px',
    }}>
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong style={{ color: 'hsl(195 85% 58%)', fontWeight: 700 }}>
      {children}
    </strong>
  ),
  hr: () => (
    <hr style={{
      border: 'none',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      margin: '1.2em 0',
    }} />
  ),
  em: ({ children }) => (
    <em style={{ color: '#94a3b8', fontStyle: 'italic' }}>
      {children}
    </em>
  ),
  ul: ({ children }) => (
    <ul style={{
      marginLeft: '1.5em',
      marginBottom: '0.6em',
      paddingLeft: '0.5em',
    }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{
      marginLeft: '1.5em',
      marginBottom: '0.6em',
      paddingLeft: '0.5em',
    }}>
      {children}
    </ol>
  ),
};

// Combined components
const mdComponents: Components = {
  ...baseComponents,
  ...createTableComponents(),
};

function AIAnalystContent() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get('alert_id') || searchParams.get('alert');
  const { messages, isStreaming, error, tokenUsage, sendMessage, clearMessages, loadMessages, resetUsage } = useLLM();
  const { sessions, activeSession, activeSessionId, createSession, switchSession, deleteSession, updateSession } = useChatHistory();
  const [input, setInput] = useState('');
  const [alertContext, setAlertContext] = useState<any>(null);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active session messages on mount or session switch
  useEffect(() => {
    if (activeSession && activeSession.messages.length > 0) {
      loadMessages(activeSession.messages);
    } else if (activeSession && activeSession.messages.length === 0) {
      clearMessages();
    }
  }, [activeSessionId, activeSession, loadMessages, clearMessages]);

  // Save messages to session after each exchange
  useEffect(() => {
    if (activeSessionId && messages.length > 0 && !isStreaming) {
      updateSession(activeSessionId, messages);
    }
  }, [messages, isStreaming, activeSessionId, updateSession]);

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

  const handleSend = async (msgOverride?: string) => {
    if (isStreaming) return;
    const userMessage = msgOverride || input.trim();
    if (!userMessage) return;
    if (!msgOverride) setInput('');
    // Create new session if none exists
    if (!activeSessionId) {
      createSession();
    }
    await sendMessage(userMessage, alertContext ? { alert_id: alertId } : undefined);
  };

  const handleQuickAction = (action: string) => {
    if (isStreaming) return;
    handleSend(`Analyze: ${action.toLowerCase()}`);
  };

  const handleNewSession = () => {
    clearMessages();
    resetUsage();
    createSession();
    setInput('');
  };

  const handleSwitchSession = (sessionId: string) => {
    switchSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      loadMessages(session.messages);
    } else {
      clearMessages();
    }
    resetUsage();
  };

  return (
    <AuthGuard>
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 140px)',
        gap: 0,
        position: 'relative',
      }}>
        {/* Sidebar Toggle (when sidebar closed) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              position: 'absolute',
              left: 8,
              top: 16,
              zIndex: 50,
              padding: '6px 8px',
              borderRadius: 6,
              background: 'hsl(228 24% 8%)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'hsl(195 85% 58%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(228 24% 8%)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Chat History Sidebar */}
        {showSidebar && (
          <ChatHistorySidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSwitchSession}
            onNewSession={handleNewSession}
            onDeleteSession={deleteSession}
            onClose={() => setShowSidebar(false)}
          />
        )}

        {/* Main Content */}
        <div className="ai-analyst-layout" style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div className="ai-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(195 85% 58%), hsla(195 85% 58% / 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)',
                border: '2px solid rgba(0, 240, 255, 0.15)',
              }}>
                <Bot size={20} style={{ color: '#020617' }} />
              </div>
              <div>
                <h1 style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'hsl(195 85% 58%)',
                  letterSpacing: '0.12em',
                  margin: 0,
                  textShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
                }}>
                  AI ANALYST
                </h1>
                <p style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  margin: '2px 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ color: 'hsla(195 85% 58% / 0.15)' }}>●</span> LLM-Powered Threat Investigation
                  {alertContext && (
                    <span style={{ color: 'hsl(152 60% 48%)', marginLeft: 6 }}>
                      • #{alertId?.slice(-8).toUpperCase()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Token Usage + Budget Widget */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Token Usage */}
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.6rem',
                color: '#94a3b8',
                textAlign: 'right',
                padding: '4px 8px',
                background: 'hsl(228 22% 11%)',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.06)',
                minWidth: 140,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Coins size={10} style={{ color: 'hsl(195 85% 58%)' }} />
                  <span style={{ color: 'hsl(195 85% 58%)', fontWeight: 600 }}>TOKEN USAGE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>In: <b style={{ color: '#f8fafc' }}>{tokenUsage.tokensIn.toLocaleString()}</b></span>
                  <span>Out: <b style={{ color: '#f8fafc' }}>{tokenUsage.tokensOut.toLocaleString()}</b></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 1 }}>
                  <span>Total: <b style={{ color: '#f8fafc' }}>{tokenUsage.totalTokens.toLocaleString()}</b></span>
                  <span style={{ color: 'hsl(152 60% 48%)' }}>${tokenUsage.costUsd.toFixed(4)}</span>
                </div>
                <div style={{ fontSize: '0.55rem', opacity: 0.6, marginTop: 1 }}>
                  {tokenUsage.requests} requests • {tokenUsage.model.split('/')[1]?.split(':')[0] || 'N/A'}
                </div>
              </div>

              {/* New Chat Button */}
              <button
                onClick={handleNewSession}
                style={{
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'hsl(195 85% 58%)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.65rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsla(195 85% 58% / 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <History size={12} />
                New
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="ai-chat">
            <div className="ai-chat-scroll">
              {messages.length === 0 ? (
                <div className="ai-empty">
                  <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>🤖</div>
                  <div>
                    THREATMATRIX AI ANALYST<br />
                    <span style={{ color: 'hsla(195 85% 58% / 0.15)', fontWeight: 600 }}>Awaiting instructions...</span>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      animation: 'fade-in-up 0.3s ease',
                    }}
                  >
                    <div style={{
                      maxWidth: '92%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, hsl(195 85% 58%), hsla(195 85% 58% / 0.15))'
                        : 'hsl(228 22% 11%)',
                      color: msg.role === 'user' ? '#020617' : '#f8fafc',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.8rem',
                      lineHeight: 1.6,
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: msg.role === 'user'
                        ? '0 2px 8px rgba(0, 240, 255, 0.2)'
                        : '0 1px 4px rgba(0, 0, 0, 0.1)',
                    }}>
                      {msg.role === 'assistant' && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          marginBottom: 6,
                          opacity: 0.8,
                          fontSize: '0.6rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'hsl(195 85% 58%)',
                        }}>
                          <Bot size={10} />
                          <span>AI ANALYST</span>
                        </div>
                      )}
                      {msg.role === 'assistant' ? (
                        <div className="md-root">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      )}
                      {msg.isStreaming && (
                        <span style={{
                          display: 'inline-block',
                          width: 2,
                          height: '1em',
                          background: 'hsl(195 85% 58%)',
                          marginLeft: 2,
                          verticalAlign: 'text-bottom',
                          animation: 'blink-cursor 1s step-end infinite',
                          boxShadow: '0 0 6px hsl(195 85% 58%)',
                        }} />
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Thinking indicator */}
              {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'hsl(228 22% 11%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94a3b8',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: 0.8,
                  }}>
                    <Loader2 size={12} className="ai-spin" />
                    <span>AI Analyst is thinking...</span>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.8rem',
                    color: 'hsl(0 72% 56%)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bot size={12} />
                      <span style={{ fontWeight: 600 }}>CONNECTION ERROR</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="ai-input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Enter query... (Shift+Enter for newline)"
                rows={2}
                className="ai-textarea"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="ai-send-btn"
              >
                {isStreaming ? (
                  <Loader2 size={14} className="ai-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ai-actions">
            {[
              { icon: AlertTriangle, label: 'Analyze Top Threat', color: 'hsl(0 72% 56%)' },
              { icon: Shield, label: 'Check IP Reputation', color: 'hsl(40 92% 56%)' },
              { icon: Activity, label: 'Model Performance', color: 'hsl(195 85% 58%)' },
              { icon: Clock, label: 'Recent Anomalies', color: 'hsl(152 60% 48%)' },
              { icon: FileText, label: 'Daily Briefing', color: 'hsl(217 80% 60%)' },
              { icon: Globe, label: 'Traffic Origins', color: 'hsl(25 90% 55%)' },
              { icon: Search, label: 'Threat Hunt', color: 'hsl(195 85% 58%)' },
              { icon: Bell, label: 'Alert Statistics', color: 'hsl(40 92% 56%)' },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.label)}
                disabled={isStreaming}
                className="ai-action-btn"
                onMouseEnter={(e) => {
                  if (!isStreaming) {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.color = action.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = isStreaming ? '#64748b' : '#94a3b8';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <action.icon size={14} strokeWidth={2} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function AIAnalystPage() {
  return (
    <Suspense fallback={<div className="ai-empty">Initializing AI Analyst...</div>}>
      <AIAnalystContent />
    </Suspense>
  );
}
