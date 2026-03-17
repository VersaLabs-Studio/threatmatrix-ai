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
import { REFRESH_INTERVALS } from '@/lib/constants';

interface BriefingResponse {
  text: string;
  generated_at: string;
  threat_count: number;
  anomaly_count: number;
}

// Static mock for demonstration
const MOCK_BRIEFING =
  'In the last hour, your network processed 46,832 flows across 12 active hosts. ' +
  'Three anomalous patterns were detected: a high-volume UDP flood from 45.33.32.156 ' +
  '(confidence: 94%), suspicious DNS tunneling behavior from 10.0.1.23 (confidence: 87%), ' +
  'and periodic beaconing to 104.21.55.12 consistent with C2 communication (confidence: 81%). ' +
  'Immediate investigation of the UDP flood is recommended.';

/** Reveals text character-by-character at `speed` ms per char */
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      idxRef.current = 0;
      requestAnimationFrame(() => {
        setDisplayed('');
      });
    }
  }, [text]);

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
  const [briefing, setBriefing]   = useState<BriefingResponse | null>(null);
  const [briefingText, setBriefingText] = useState('');

  const fetchBriefing = async () => {
    const { data } = await api.get<BriefingResponse>('/api/v1/llm/briefing');
    if (data) {
      setBriefing(data);
      setBriefingText(data.text);
    } else {
      // Use mock when backend isn't ready
      setBriefingText(MOCK_BRIEFING);
    }
  };

  useEffect(() => {
    void fetchBriefing();
    const interval = setInterval(fetchBriefing, REFRESH_INTERVALS.briefing);
    return () => clearInterval(interval);
  }, []);

  const { displayed, isDone } = useTypewriter(briefingText);

  return (
    <GlassPanel
      tilt
      refract
      icon="🤖"
      title="AI BRIEFING"
      badge={briefing ? `${briefing.threat_count} threats detected` : 'Live'}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle cyan glow top border */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: '10%', right: '10%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--spotlight-color), transparent)',
          opacity: 0.8,
        }}
      />

      <p
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          margin: 0,
          minHeight: '3.5rem',
        }}
      >
        {displayed || ''}
        {!isDone && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: '1em',
              background: 'var(--cyan)',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }}
          />
        )}
      </p>

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
