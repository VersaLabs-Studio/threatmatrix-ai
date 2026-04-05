'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AIBriefingWidget
// LLM-generated threat summary with caching
// Data: GET /api/v1/llm/briefing/cached (cached 5 minutes)
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { API_BASE_URL } from '@/lib/constants';

/** Format briefing text with basic markdown-like styling */
function formatBriefingText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
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
    if (line.trim() === '') {
      return <div key={i} style={{ height: 8 }} />;
    }
    return <div key={i}>{line}</div>;
  });
}

export function AIBriefingWidget() {
  const [briefingText, setBriefingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchBriefing = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
      console.log('[AIBriefing] Fetching briefing, token:', token ? 'present' : 'missing');
      
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
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
          throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 200)}`);
        }

        const data = await res.json();
        console.log('[AIBriefing] Response keys:', Object.keys(data));
        console.log('[AIBriefing] Cached:', data.cached, 'Briefing length:', data.briefing?.length || 0);

        if (!cancelled) {
          if (data.briefing && data.briefing.length > 0) {
            console.log('[AIBriefing] Setting briefing, length:', data.briefing.length);
            setBriefingText(data.briefing);
            setIsCached(data.cached || false);
            setLoading(false);
          } else {
            console.error('[AIBriefing] No briefing in response:', data);
            setError('No briefing content returned');
            setLoading(false);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[AIBriefing] Failed to fetch briefing:', e);
          setError(e instanceof Error ? e.message : 'Failed to fetch briefing');
          setLoading(false);
        }
      }
    };

    fetchBriefing();
    const interval = setInterval(fetchBriefing, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  console.log('[AIBriefing] Render:', { loading, briefingText: briefingText.length, isCached, error });

  return (
    <GlassPanel
      icon="🤖"
      title="AI BRIEFING"
      badge={loading ? 'Loading...' : isCached ? 'Cached' : 'Generated'}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '4rem' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Loading threat briefing...
          </span>
        </div>
      ) : error && !briefingText ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '4rem' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', color: 'var(--critical)' }}>
            {error}
          </span>
          <button
            onClick={() => window.location.reload()}
            style={{ background: 'transparent', border: '1px solid var(--cyan)', color: 'var(--cyan)', padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', marginLeft: 12, borderRadius: 4 }}
          >
            Retry
          </button>
        </div>
      ) : briefingText ? (
        <div style={{ maxHeight: 350, overflowY: 'auto', paddingRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {formatBriefingText(briefingText)}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '4rem' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Waiting for briefing...
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
        <Link href="/ai-analyst" style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--cyan)', textDecoration: 'none', opacity: 0.8 }}>
          View Full Briefing →
        </Link>
      </div>
    </GlassPanel>
  );
}
