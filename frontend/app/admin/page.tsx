'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Administration Console
// System configuration, user management, and audit logs
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { DataTable }  from '@/components/shared/DataTable';
import { MOCK_ADMIN_USERS, MOCK_AUDIT_LOGS, MOCK_LLM_USAGE } from '@/lib/mock-data';
import { Users, Settings, CreditCard, ShieldCheck, ClipboardList } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

type Tab = 'users' | 'config' | 'budget' | 'feeds' | 'audit';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
          ADMINISTRATION
        </h1>
      </header>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>⚙️</span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
              SYSTEM ADMINISTRATION
            </h1>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              Unified Control Plane & Governance Dashboard
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--border)', paddingBottom: 1, borderRadius: 4, overflow: 'hidden' }}>
          <AdminTab icon={<Users size={14} />} label="USERS" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <AdminTab icon={<Settings size={14} />} label="CONFIG" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
          <AdminTab icon={<CreditCard size={14} />} label="BUDGET" active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
          <AdminTab icon={<ShieldCheck size={14} />} label="FEEDS" active={activeTab === 'feeds'} onClick={() => setActiveTab('feeds')} />
          <AdminTab icon={<ClipboardList size={14} />} label="AUDIT LOGS" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, minHeight: 400 }}>
          {activeTab === 'users'  && <UsersTab />}
          {activeTab === 'config' && <ConfigTab />}
          {activeTab === 'budget' && <BudgetTab />}
          {activeTab === 'audit'  && <AuditTab />}
          {activeTab === 'feeds'  && <FeedsTab />}
      </div>
    </div>
  );
}

function AdminTab({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px',
        background: active ? 'var(--bg-secondary)' : 'var(--bg-dark)',
        border: 'none',
        borderBottom: active ? '2px solid var(--cyan)' : 'none',
        color: active ? 'var(--cyan)' : 'var(--text-muted)',
        fontFamily: 'var(--font-data)',
        fontSize: '0.65rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  );
}

function UsersTab() {
  const COLUMNS = [
    { key: 'name',   header: 'NAME', width: 180, render: (r: any) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'email',  header: 'EMAIL', width: 220, render: (r: any) => <span style={{ opacity: 0.7 }}>{r.email}</span> },
    { key: 'role',   header: 'ROLE', width: 120, render: (r: any) => (
      <span style={{ fontSize: '0.6rem', color: 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase' }}>{r.role}</span>
    )},
    { key: 'last_active', header: 'LAST ACTIVE', width: 140, render: (r: any) => <span style={{ fontSize: '0.65rem' }}>{r.last_active}</span> },
    { key: 'status', header: 'STATUS', width: 100, render: (r: any) => (
      <span style={{ color: r.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>{r.status.toUpperCase()}</span>
    )},
  ];

  return (
    <GlassPanel static title="USER REGISTRY" icon="👥">
      <DataTable columns={COLUMNS} data={MOCK_ADMIN_USERS} rowKey={r => r.id} maxHeight={400} />
    </GlassPanel>
  );
}

function ConfigTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-4)' }}>
      <GlassPanel static title="GATEWAY THRESHOLDS" icon="⚙️">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2)' }}>
          <ConfigInput label="Critical Alert Threshold" value="0.92" />
          <ConfigInput label="High Alert Threshold" value="0.75" />
          <ConfigInput label="Data Retention (Days)" value="90" />
          <ConfigInput label="Max PCAP Size (MB)" value="2048" />
          <button style={{ background: 'var(--cyan)', border: 'none', borderRadius: 4, padding: '8px', fontSize: '0.7rem', fontWeight: 700, marginTop: 12, cursor: 'pointer', color: 'var(--bg-dark)' }}>SAVE CHANGES</button>
        </div>
      </GlassPanel>
      <GlassPanel static title="SYSTEM FLAGS" icon="🚩">
         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FlagToggle label="Enable Full Packet Capture" checked={true} />
            <FlagToggle label="Deep inspection on Internal Flows" checked={false} />
            <FlagToggle label="Auto-retrain ML models on high drift" checked={true} />
            <FlagToggle label="Allow external API access" checked={false} />
         </div>
      </GlassPanel>
    </div>
  );
}

function ConfigInput({ label, value }: any) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input defaultValue={value} style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: '0.7rem', outline: 'none' }} />
    </div>
  );
}

function FlagToggle({ label, checked }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ width: 32, height: 16, background: checked ? 'var(--cyan)' : 'var(--bg-tertiary)', borderRadius: 8, position: 'relative', cursor: 'pointer' }}>
         <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: checked ? 18 : 2 }} />
      </div>
    </div>
  );
}

function BudgetTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
      <GlassPanel static title="LLM TOKEN BUDGET" icon="💰">
        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
           <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-data)' }}>$142.38</div>
           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SPENT OF $250.00 BUDGET</div>
           <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, margin: '20px 0', overflow: 'hidden' }}>
             <div style={{ height: '100%', width: '57%', background: 'var(--cyan)' }} />
           </div>
           <button style={{ padding: '8px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.6rem', color: 'var(--text-primary)', borderRadius: 4, cursor: 'pointer' }}>REFILL BUDGET</button>
        </div>
      </GlassPanel>

      <GlassPanel static title="DAILY USAGE VELOCITY" icon="📈">
        <div style={{ height: 250, width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart data={MOCK_LLM_USAGE}>
              <defs>
                <linearGradient id="colorUsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', fontSize: 10, borderRadius: 4 }}
              />
              <Area type="monotone" dataKey="val" stroke="var(--cyan)" fillOpacity={1} fill="url(#colorUsg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>
    </div>
  );
}

function FeedsTab() {
  const feeds = [
    { name: 'OTX AlienVault', status: 'Online', last_sync: '5m ago', color: 'var(--cyan)' },
    { name: 'AbuseIPDB',      status: 'Online', last_sync: '12m ago', color: 'var(--cyan)' },
    { name: 'VirusTotal (V3)', status: 'Online', last_sync: '1h ago', color: 'var(--cyan)' },
    { name: 'Internal S.I.M', status: 'Standby', last_sync: '6h ago', color: 'var(--text-muted)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
      {feeds.map(f => (
        <div key={f.name} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800 }}>{f.name}</h3>
            <span style={{ fontSize: '0.6rem', color: f.color, fontWeight: 700 }}>{f.status}</span>
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Last synced: {f.last_sync}</p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '0.6rem', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}>API KEY</button>
            <button style={{ flex: 1, padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '0.6rem', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}>SYNC NOW</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab() {
  const COLUMNS = [
    { key: 'actor',     header: 'ACTOR',     width: 180, render: (r: any) => <code style={{ color: 'var(--cyan)' }}>{r.actor}</code> },
    { key: 'action',    header: 'ACTION',    width: 180, render: (r: any) => <span style={{ fontWeight: 600 }}>{r.action}</span> },
    { key: 'resource',  header: 'RESOURCE',  width: 150, render: (r: any) => <span style={{ opacity: 0.7 }}>{r.resource}</span> },
    { key: 'timestamp', header: 'TIMESTAMP', width: 140 },
    { key: 'ip',        header: 'IP ADDRESS', width: 120 },
  ];

  return (
    <GlassPanel static title="SYSTEM AUDIT TRAIL" icon="📜">
      <DataTable columns={COLUMNS} data={MOCK_AUDIT_LOGS} rowKey={r => r.id} maxHeight={400} />
    </GlassPanel>
  );
}
