'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AIBriefingWidget
// LLM-generated threat summary with typing cursor effect
// Data: GET /api/v1/llm/briefing (cached 5 minutes)
// ═══════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { REFRESH_INTERVALS, API_BASE_URL } from '@/lib/constants';

interface BriefingResponse {
  text: string;
  generated_at: string;
  threat_count: number;
  anomaly_count: number;
}

// No mock data — briefing is generated via LLM API

/** Format briefing text with basic markdown-like styling */
function formatBriefingText(text: string): React.ReactNode {
  // Split by lines and apply styling
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold text: **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    if (boldRegex.test(line)) {
      const parts = line.split(boldRegex);
      return (
        <div key={i} style={{ marginBottom: line.trim() === '' ? 8 : 0 }}>
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} style={{ color: 'var(--cyan)', fontWeight: 600 }}>{part}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </div>
      );
    }
    // Empty lines
    if (line.trim() === '') {
      return <div key={i} style={{ height: 8 }} />;
    }
    // Regular text
    return <div key={i}>{line}</div>;
  });
}

/** Reveals text character-by-character at `speed` ms per char */
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      idxRef.current = 0;
      setDisplayed('');
    }
  }, [text]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (idxRef.current >= textRef.current.length) return;
    const timer = setTimeout(() => {
      idxRef.current += 1;
      setDisplayed(textRef.current.slice(0, idxRef.current));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, speed]);

  const isDone = displayed.length >= text.length;
  return { displayed, isDone };
}

export function AIBriefingWidget() {
  const [briefingText, setBriefingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateBriefing = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    console.log('[AIBriefing] Starting briefing generation, token:', token ? 'present' : 'missing');
    setLoading(true);
    setError(null);
    try {
      const requestBody = {
        messages: [{ role: 'user', content: 'Generate a brief threat briefing summarizing the current security posture, active threats, and recommended actions. Be concise and actionable.' }],
        task_type: 'daily_briefing',
        max_tokens: 512,
      };
      console.log('[AIBriefing] Request:', { url: `${API_BASE_URL}/api/v1/llm/chat`, body: requestBody });
      
      const res = await fetch(`${API_BASE_URL}/api/v1/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[AIBriefing] Response status:', res.status, res.statusText);
      console.log('[AIBriefing] Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[AIBriefing] Error response:', errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText.substring(0, 200)}`);
      }
      
      const contentType = res.headers.get('content-type') || '';
      console.log('[AIBriefing] Content-Type:', contentType);
      let content = '';
      
      if (contentType.includes('text/event-stream')) {
        // Handle SSE streaming response
        const text = await res.text();
        console.log('[AIBriefing] SSE response (first 500 chars):', text.substring(0, 500));
        
        // Parse SSE format: "data: {...}\n\ndata: [DONE]\n\n"
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            console.log('[AIBriefing] SSE data:', data.substring(0, 100));
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              console.log('[AIBriefing] Parsed SSE keys:', Object.keys(parsed));
              // Our backend format: { token: "..." }
              if (parsed.token) {
                content += parsed.token;
              } else if (parsed.choices?.[0]?.delta?.content) {
                content += parsed.choices[0].delta.content;
              } else if (parsed.content) {
                content += parsed.content;
              } else if (parsed.choices?.[0]?.message?.content) {
                content += parsed.choices[0].message.content;
              } else {
                console.warn('[AIBriefing] Unknown SSE format:', parsed);
              }
            } catch (e) {
              console.warn('[AIBriefing] Failed to parse SSE line:', line, e);
            }
          }
        }
      } else {
        // Handle regular JSON response
        const data = await res.json();
        console.log('[AIBriefing] JSON response:', JSON.stringify(data, null, 2).substring(0, 500));
        
        if (data.content) {
          content = data.content;
        } else if (data.choices?.[0]?.message?.content) {
          content = data.choices[0].message.content;
        } else if (data.choices?.[0]?.delta?.content) {
          content = data.choices[0].delta.content;
        } else if (data.message?.content) {
          content = data.message.content;
        } else if (typeof data === 'string') {
          content = data;
        } else {
          console.warn('[AIBriefing] Unknown response format:', data);
        }
      }
      
      console.log('[AIBriefing] Extracted content:', content ? `${content.substring(0, 100)}...` : 'EMPTY');
      
      if (content) {
        setBriefingText(content);
      } else {
        setError('No briefing content returned');
      }
    } catch (e) {
      console.error('[AIBriefing] Failed to generate briefing:', e);
      setError(e instanceof Error ? e.message : 'Failed to generate briefing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void generateBriefing();
    const interval = setInterval(generateBriefing, REFRESH_INTERVALS.briefing);
    return () => clearInterval(interval);
  }, []);

  const { displayed, isDone } = useTypewriter(briefingText);

  return (
    <GlassPanel
      icon="🤖"
      title="AI BRIEFING"
      badge={loading ? 'Generating...' : 'Complete'}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle cyan glow top border */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: '10%', right: '10%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
          opacity: 0.6,
        }}
      />

      {loading && !briefingText ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '4rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            Generating threat briefing...
          </span>
        </div>
      ) : error && !briefingText ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '4rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-sm)',
            color: 'var(--critical)',
          }}>
            {error}
          </span>
          <button
            onClick={generateBriefing}
            style={{
              background: 'transparent',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-data)',
              fontSize: 'var(--text-xs)',
              marginLeft: 12,
              borderRadius: 4,
            }}
          >
            Retry
          </button>
        </div>
      ) : briefingText ? (
        <div style={{
          maxHeight: 350,
          overflowY: 'auto',
          paddingRight: 12,
        }}>
          <div
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.62rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {formatBriefingText(briefingText)}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '4rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            Waiting for briefing...
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
        <Link
          href="/ai-analyst"
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-xs)',
            color: 'var(--cyan)',
            textDecoration: 'none',
            opacity: 0.8,
          }}
        >
          View Full Briefing →
        </Link>
      </div>
    </GlassPanel>
  );
}
