'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — PacketInspector
// Detailed view of packets from a PCAP file
// ═══════════════════════════════════════════════════════

import { DataTable } from '@/components/shared/DataTable';
import { MOCK_PACKETS } from '@/lib/mock-data';

export function PacketInspector() {
  const COLUMNS = [
    { key: 'no',       header: 'No.',      width: 60,  render: (r: any) => <span style={{ opacity: 0.5 }}>{r.no}</span> },
    { key: 'time',     header: 'Time',     width: 100, render: (r: any) => <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{r.time}</span> },
    { key: 'src',      header: 'Source',   width: 130, render: (r: any) => <code style={{ color: 'var(--cyan)' }}>{r.src}</code> },
    { key: 'dst',      header: 'Destination', width: 130, render: (r: any) => <code style={{ color: 'var(--text-secondary)' }}>{r.dst}</code> },
    { key: 'protocol', header: 'Protocol', width: 80,  render: (r: any) => (
      <span style={{ 
        fontSize: '0.6rem', 
        padding: '2px 6px', 
        background: r.protocol === 'TLSv1.2' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(34, 197, 94, 0.1)',
        color: r.protocol === 'TLSv1.2' ? 'hsl(270, 70%, 70%)' : 'hsl(142, 70%, 70%)',
        borderRadius: 4,
        fontWeight: 700
      }}>
        {r.protocol}
      </span>
    )},
    { key: 'length',   header: 'Length',   width: 70 },
    { key: 'info',     header: 'Info',     width: 250, render: (r: any) => <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{r.info}</span> },
  ];

  return (
    <div style={{ height: 400 }}>
       <DataTable
         columns={COLUMNS}
         data={MOCK_PACKETS}
         rowKey={(r) => String(r.no)}
         maxHeight="100%"
       />
    </div>
  );
}
