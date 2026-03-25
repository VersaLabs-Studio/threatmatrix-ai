'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AI Analyst Page (Scaffold)
// LLM-powered threat analysis interface
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, Send, AlertTriangle, Shield, Activity, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AIAnalystPage() {
  const searchParams = useSearchParams();
  const alertId = searchParams.get('alert');
  
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: alertId 
        ? `I'm analyzing alert #${alertId.slice(-8).toUpperCase()}. The ML ensemble has detected potential threats. I can provide detailed analysis of the attack patterns, recommend mitigation strategies, and correlate with historical data. What would you like to know?`
        : 'Welcome to the AI Analyst. I can help you analyze network anomalies, investigate alerts, and provide threat intelligence context. I have access to ML model outputs, flow data, and alert history. What would you like to investigate?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate AI response (placeholder for LLM integration)
    setTimeout(() => {
      const responses = [
        'Based on the ML ensemble analysis, this flow exhibits characteristics of a port scan attack. The Isolation Forest model flagged it with 0.87 confidence, and the Random Forest classified it as "probe" with 92% certainty. I recommend blocking the source IP and monitoring for similar patterns.',
        'The anomaly score of 0.94 indicates high confidence in threat detection. Cross-referencing with the threat intelligence database, this IP has been associated with known C2 infrastructure. The Autoencoder reconstruction error confirms unusual traffic patterns.',
        'Analyzing the flow metadata: 248KB transferred over 12.4 seconds on port 443. While HTTPS traffic is normal, the destination IP resolves to a recently registered domain with no established reputation. The ensemble models agree this warrants investigation.',
        'The alert was triggered by the ML Worker after scoring the flow at 0.78 composite. Model agreement is "majority" — both Random Forest and Isolation Forest flagged this as anomalous. The Autoencoder reconstruction error is 0.45, supporting the anomaly classification.',
      ];
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responses[Math.floor(Math.random() * responses.length)]
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <AuthGuard>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 180px)',
        gap: 'var(--space-4)'
      }}>
        {/* Header */}
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
              LLM-powered threat investigation • ML context enabled
            </p>
          </div>
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
                key={idx}
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
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bot size={12} />
                    <span>Analyzing...</span>
                    <span className="typing-indicator">●</span>
                    <span className="typing-indicator" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="typing-indicator" style={{ animationDelay: '0.4s' }}>●</span>
                  </div>
                </div>
              </div>
            )}
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
              disabled={!input.trim() || isTyping}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                background: input.trim() ? 'var(--cyan)' : 'var(--bg-tertiary)',
                color: input.trim() ? 'var(--bg-dark)' : 'var(--text-muted)',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
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