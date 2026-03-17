'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useLLM Hook (MOCKED)
// Simulates AI streaming responses character by character
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface UseLLMReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  tokenBudget: { spent: number; total: number } | null;
  sendMessage: (content: string, context?: Record<string, unknown>) => Promise<void>;
  clearMessages: () => void;
}

import { demoEmitter } from '@/lib/demo-emitter';

// Some simulated dynamic responses based on common demo queries
const generateResponseFor = (input: string) => {
  const lowercase = input.toLowerCase();
  
  if (lowercase === '/simulate breach' || lowercase === '/simulate attack') {
    return 'CRITICAL: Multi-vector attack simulation initiated. Injecting anomalous flows and triggering SOC alert system. Observe the War Room Threat Map and Dashboard for live telemetry deviations.';
  }

  if (lowercase === '/resolve' || lowercase === '/mitigate') {
    return 'Anomaly signature neutralized. Closing open incident tickets and restoring system status to ELEVATED. Telemetry returning to baseline...';
  }

  if (lowercase.includes('alert') || lowercase.includes('apt-29')) {
    return 'Analysis of ALT-9042 confirms an active data exfiltration event. The traffic pattern strongly correlates with APT-29 signatures. I have isolated the affected Database Subnet and generated a preliminary incident report. Would you like me to initiate the auto-remediation playbook?';
  }
  if (lowercase.includes('network') || lowercase.includes('flow')) {
    return 'Current network status indicates elevated load due to a DNS tunneling anomaly detected 3 minutes ago. I am currently monitoring the source IPs (primarily 45.33.32.156) and dynamically adjusting rate limits to mitigate the impact.';
  }
  return `Acknowledged. Evaluating query: "${input}". Based on the current threat intelligence and telemetry data, I do not detect any immediate critical anomalies related to this. However, I will continue to process the logs in the background and notify you of any deviations.`;
};

export function useLLM(): UseLLMReturn {
  const [messages, setMessages]     = useState<ChatMessage[]>([{
    id: 'msg-welcome',
    role: 'assistant',
    content: 'ThreatMatrix AI Agent is online. Type `/simulate breach` to test the SOC response system.',
    timestamp: new Date().toISOString()
  }]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error]           = useState<string | null>(null);
  const [tokenBudget, setTokenBudget] = useState<{ spent: number; total: number }>({ spent: 450, total: 10000 });
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Push local
    setMessages((prev) => [...prev, userMsg]);

    // Command handling
    if (content.toLowerCase() === '/simulate breach' || content.toLowerCase() === '/simulate attack') {
      demoEmitter.emit('ANOMALY_TRIGGERED');
    } else if (content.toLowerCase() === '/resolve' || content.toLowerCase() === '/mitigate') {
      demoEmitter.emit('ANOMALY_RESOLVED');
    }

    const targetResponse = generateResponseFor(content);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    // Update tokens loosely
    setTokenBudget(prev => ({ spent: prev.spent + 120, total: prev.total }));

    // Simulate typing effect
    let charIndex = 0;
    const typeNextChar = () => {
      if (charIndex < targetResponse.length) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMsg.id 
            ? { ...m, content: targetResponse.slice(0, charIndex + 1) } 
            : m
        ));
        charIndex++;
        const delay = Math.random() * 15 + 5; 
        timeoutRefs.current.push(setTimeout(typeNextChar, delay));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === assistantMsg.id 
            ? { ...m, isStreaming: false } 
            : m
        ));
        setIsStreaming(false);
      }
    };

    timeoutRefs.current.push(setTimeout(typeNextChar, 400));

  }, [isStreaming]);

  const clearMessages = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, tokenBudget, sendMessage, clearMessages };
}
