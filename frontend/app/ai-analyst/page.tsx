'use client';

import { Send, Cpu, Terminal, Zap, Bot, User, Trash2, Shield } from 'lucide-react';

export default function AIAnalystPage() {
  const mockMessages = [
    { role: 'assistant', content: 'Neural link established. ThreatMatrix AI Analyst is online. I have analyzed the recent data exfiltration alert ALT-9042. Would you like a detailed correlation report?' },
    { role: 'user', content: 'Yes, correlate with known APT signatures.' },
    { role: 'assistant', content: 'CORRELATION COMPLETE: The traffic pattern matches APT-29 (Midnight Blizzard) techniques. Specifically, the use of legitimate cloud storage APIs for data staging (T1567.002). I recommend immediate isolation of the Database Subnet.' },
  ];

  return (
    <div className="page-enter" style={{ padding: 'var(--space-4)', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <header className="mb-6 flex justify-between items-center text-primary">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="text-[var(--cyan)]" size={32} />
            AI Analyst Terminal
          </h1>
          <p className="text-[var(--text-muted)] font-mono text-sm mt-1">
            ENGINE: <span className="text-[var(--cyan)]">GPT-4O HYPER-THREADED</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel-static py-1 px-4 flex items-center gap-3">
            <Cpu size={14} className="text-[var(--text-muted)]" />
            <span className="font-mono text-[10px] text-[var(--text-muted)]">SYSTEM LOAD: 12%</span>
            <div className="w-20 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--cyan)] w-1/4"></div>
            </div>
          </div>
          <button className="btn-aether py-1 px-4 text-xs flex items-center gap-2 text-[var(--critical)]">
            <Trash2 size={14} /> PURGE SESSION
          </button>
        </div>
      </header>

      <div className="flex-1 glass-panel glass-panel-noise mb-4 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {mockMessages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'assistant' ? 'max-w-3xl' : 'max-w-2xl ml-auto flex-row-reverse'}`}>
              <div className={`p-2 rounded h-fit ${msg.role === 'assistant' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]' : 'bg-[var(--purple-dim)] text-[var(--purple)]'}`}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`p-4 rounded-lg border ${
                msg.role === 'assistant' 
                  ? 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-[var(--text-primary)]' 
                  : 'bg-[var(--bg-tertiary)] border-[var(--glass-border)] text-[var(--text-secondary)]'
              }`}>
                <p className="text-sm font-mono leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]/50">
          <div className="flex gap-4 items-center">
            <Terminal size={18} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Ask the AI Analyst anything... (e.g. 'Investigate ALT-9042')"
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-primary placeholder:text-[var(--text-muted)]"
            />
            <button className="btn-aether py-2 px-4">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <button className="glass-panel text-left hover:bg-[var(--bg-hover)] transition-colors group">
          <Zap size={16} className="text-[var(--cyan)] mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold font-mono">GENERATE REPORT</h4>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Full correlation PDF</p>
        </button>
        <button className="glass-panel text-left hover:bg-[var(--bg-hover)] transition-colors group">
          <Shield size={16} className="text-[var(--safe)] mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold font-mono">DEPLOY MITIGATION</h4>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Isolate infected nodes</p>
        </button>
        <button className="glass-panel text-left hover:bg-[var(--bg-hover)] transition-colors group">
          <Terminal size={16} className="text-[var(--purple)] mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold font-mono">QUERY LOGS</h4>
          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Cross-reference SIEM</p>
        </button>
      </div>
    </div>
  );
}

