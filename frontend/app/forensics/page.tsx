'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Forensics Lab Page
// Deep packet inspection and historic PCAP analysis
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';
import { PCAPUpload }  from '@/components/forensics/PCAPUpload';
import { PacketInspector } from '@/components/forensics/PacketInspector';
import { DataTable }   from '@/components/shared/DataTable';
import { MOCK_PCAP_UPLOADS } from '@/lib/mock-data';
import { FileSearch, History, ShieldAlert, Cpu } from 'lucide-react';

export default function ForensicsLabPage() {

  const HISTORY_COLUMNS = [
    { key: 'filename',   header: 'FILENAME', width: 220, render: (r: any) => <span style={{ fontWeight: 600 }}>{r.filename}</span> },
    { key: 'size',       header: 'SIZE',     width: 80,  render: (r: any) => <span style={{ color: 'var(--text-muted)' }}>{r.size}</span> },
    { key: 'anomaly_count', header: 'ANOMALIES', width: 90, render: (r: any) => (
      <span style={{ color: r.anomaly_count > 0 ? 'var(--critical)' : 'var(--success)', fontWeight: 700 }}>
        {r.anomaly_count}
      </span>
    )},
    { key: 'status',     header: 'STATUS',   width: 100, render: (r: any) => (
      <span style={{ 
        fontSize: '0.6rem', 
        color: r.status === 'completed' ? 'var(--success)' : 'var(--critical)',
        textTransform: 'uppercase',
        fontWeight: 700 
      }}>
        {r.status}
      </span>
    )},
    { key: 'uploaded_at', header: 'TIME',    width: 120, render: (r: any) => (
       <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{new Date(r.uploaded_at).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minHeight: '100%' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>
          FORENSICS LAB
        </h1>
      </header>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>🔬</span>
          <div>
            <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
              FORENSICS LABORATORY
            </h1>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              Deep Packet Inspection & Historic Context Rehydration
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <GlassPanel static icon="📥" title="INGEST NETWORK CAPTURE">
              <PCAPUpload />
            </GlassPanel>

            <GlassPanel static icon="⌛" title="UPLOAD HISTORY">
              <DataTable 
                columns={HISTORY_COLUMNS}
                data={MOCK_PCAP_UPLOADS}
                rowKey={(r) => r.id}
                maxHeight={200}
              />
            </GlassPanel>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <ForensicsMetric icon={<FileSearch size={18} />} label="PCAPS ANALYZED" value="142" />
              <ForensicsMetric icon={<ShieldAlert size={18} />} label="IDENTIFIED THREATS" value="12" accent="critical" />
              <ForensicsMetric icon={<Cpu size={18} />} label="TOTAL PACKETS" value="8.4B" />
              <ForensicsMetric icon={<History size={18} />} label="STORAGE USED" value="1.8 TB" />
            </div>

            <GlassPanel static icon="🧬" title="ANALYSIS SUMMARY">
              <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
                 <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Select a PCAP from history or upload a new file to view deep analysis results.
                 </div>
              </div>
            </GlassPanel>
          </div>
        </div>

      <GlassPanel static icon="🔎" title="PACKET INSPECTOR (VIEWING: intrusion_attempt_0316.pcap)">
        <PacketInspector />
      </GlassPanel>

    </div>
  );
}

function ForensicsMetric({ icon, label, value, accent }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      border: '1px solid var(--border)', 
      borderRadius: 'var(--radius-sm)', 
      padding: 'var(--space-3)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{ color: accent ? `var(--${accent})` : 'var(--cyan)', opacity: 0.8 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-data)' }}>{value}</div>
      </div>
    </div>
  );
}
