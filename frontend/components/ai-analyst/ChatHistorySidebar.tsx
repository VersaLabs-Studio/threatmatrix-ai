'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Chat History Sidebar
// Collapsible left sidebar showing past conversations
// ═══════════════════════════════════════════════════════

import { Plus, Trash2, MessageSquare, PanelLeftClose } from 'lucide-react';
import type { ChatSession } from '@/hooks/useChatHistory';

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

export function ChatHistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClose,
}: ChatHistorySidebarProps) {
  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      width: 260,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'hsl(228 24% 8%)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'hsl(195 85% 58%)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Chat History
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={onNewSession}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'hsl(195 85% 58%)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            title="New Chat"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsla(195 85% 58% / 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            title="Close sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {/* Session List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 6px',
      }}>
        {sessions.length === 0 ? (
          <div style={{
            padding: '20px 12px',
            textAlign: 'center',
            color: '#64748b',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.7rem',
          }}>
            <MessageSquare size={20} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>No conversations yet</div>
            <div style={{ marginTop: 4, opacity: 0.6 }}>Start a new chat to begin</div>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                marginBottom: 4,
                cursor: 'pointer',
                background: session.id === activeSessionId
                  ? 'hsla(195 85% 58% / 0.12)'
                  : 'transparent',
                border: session.id === activeSessionId
                  ? '1px solid hsla(195 85% 58% / 0.25)'
                  : '1px solid transparent',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (session.id !== activeSessionId) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (session.id !== activeSessionId) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.7rem',
                color: session.id === activeSessionId
                  ? 'hsl(195 85% 58%)'
                  : '#e2e8f0',
                fontWeight: session.id === activeSessionId ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: 24,
              }}>
                {session.title}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 4,
                fontSize: '0.6rem',
                color: '#64748b',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                <span>{formatTime(session.updatedAt)}</span>
                <span>{session.messageCount} msgs</span>
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  padding: 2,
                  borderRadius: 3,
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = 'hsl(0 72% 56%)';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.6rem',
          color: '#64748b',
          textAlign: 'center',
        }}>
          {sessions.length} / 50 conversations
        </div>
      )}
    </div>
  );
}
