'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useChatHistory Hook
// Manages conversation lifecycle with localStorage persistence
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@/hooks/useLLM';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const STORAGE_KEY = 'tm_chat_history';
const MAX_SESSIONS = 50;

function generateTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'New Conversation';
  const content = firstUserMsg.content.trim();
  if (content.length <= 40) return content;
  return content.slice(0, 37) + '...';
}

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const trimmed = sorted.slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[ChatHistory] Failed to save sessions:', e);
  }
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  // Create new session
  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    setSessions(prev => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, []);

  // Switch active session
  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveSessions(updated);
      return updated;
    });
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  // Update session messages (called after each message exchange)
  const updateSession = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => {
      const updated = prev.map(session => {
        if (session.id !== sessionId) return session;
        const title = session.messageCount === 0 ? generateTitle(messages) : session.title;
        return {
          ...session,
          messages,
          title,
          updatedAt: new Date().toISOString(),
          messageCount: messages.length,
        };
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  // Clear all sessions
  const clearAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSessions([]);
    setActiveSessionId(null);
  }, []);

  // Get active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    updateSession,
    clearAll,
  };
}
