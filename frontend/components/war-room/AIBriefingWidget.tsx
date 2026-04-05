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
  const [isCached, setIsCached] = useState(false);

  const fetchBriefing = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    console.log('[AIBriefing] Fetching briefing, token:', token ? 'present' : 'missing');
    setLoading(true);
    setError(null);
    try {
      // First try to get cached briefing (fast)
      const res = await fetch(`${API_BASE_URL}/api/v1/llm/briefing/cached`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log('[AIBriefing] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[AIBriefing] Error response:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await res.json();
      console.log('[AIBriefing] Cached:', data.cached, 'Content length:', data.briefing?.length);

      if (data.briefing) {
        setBriefingText(data.briefing);
        setIsCached(data.cached);
      } else {
        setError('No briefing content returned');
      }
    } catch (e) {
      console.error('[AIBriefing] Failed to fetch briefing:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch briefing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBriefing();
    // Refresh every 5 minutes (cached briefings expire after 5 min)
    const interval = setInterval(fetchBriefing, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Always call useTypewriter (hooks can't be conditional)
  const { displayed, isDone } = useTypewriter(briefingText);
  // Override for cached briefings to show instantly
  const finalDisplayed = isCached ? briefingText : displayed;
  const finalIsDone = isCached ? true : isDone;

  return (
    <GlassPanel
      icon="🤖"
      title="AI BRIEFING"
      badge={loading ? 'Loading...' : isCached ? 'Cached' : 'Generated'}
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
            onClick={fetchBriefing}
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
            {formatBriefingText(finalDisplayed)}
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
