'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Forensics Lab (v0.5.0)
// PCAP Upload and Packet Analysis
// ═══════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Upload, FileSearch, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface PCAPFile {
  id: string;
  filename: string;
  size: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  packets: number | null;
  flows: number | null;
  anomalies: number | null;
  uploaded: string;
}

// Mock PCAP uploads
const MOCK_UPLOADS: PCAPFile[] = [
  { id: 'pcap-001', filename: 'ddos_attack_sample.pcap', size: '24.5 MB', status: 'complete', packets: 45200, flows: 1240, anomalies: 18, uploaded: '2026-03-10 14:30' },
  { id: 'pcap-002', filename: 'normal_traffic.pcapng', size: '12.1 MB', status: 'complete', packets: 18900, flows: 520, anomalies: 0, uploaded: '2026-03-11 09:15' },
  { id: 'pcap-003', filename: 'port_scan_capture.pcap', size: '8.7 MB', status: 'processing', packets: null, flows: null, anomalies: null, uploaded: '2026-03-12 11:45' },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'var(--text-muted)', label: 'Pending' },
  processing: { icon: Clock, color: 'var(--warning)', label: 'Processing' },
  complete: { icon: CheckCircle, color: 'var(--safe)', label: 'Complete' },
  error: { icon: AlertTriangle, color: 'var(--critical)', label: 'Error' },
};

export default function ForensicsLabPage() {
  const [uploads] = useState<PCAPFile[]>(MOCK_UPLOADS);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Forensics Lab
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            PCAP upload and packet analysis
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <GlassPanel style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}>
          <Upload size={32} style={{ color: 'var(--cyan)', marginBottom: 'var(--space-3)' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
            Drop PCAP files here or click to upload
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Supports .pcap and .pcapng files up to 500MB
          </p>
        </div>
      </GlassPanel>

      {/* Upload History */}
      <GlassPanel>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
          <FileSearch size={18} style={{ marginRight: 8, color: 'var(--cyan)' }} />
          Upload History
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {uploads.map(file => {
            const statusConfig = STATUS_CONFIG[file.status];
            const StatusIcon = statusConfig.icon;
            return (
              <div key={file.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                <StatusIcon size={18} style={{ color: statusConfig.color }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)' }}>
                    {file.filename}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    {file.size} • Uploaded {file.uploaded}
                  </p>
                </div>
                {file.status === 'complete' && (
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{file.packets?.toLocaleString()} pkts</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{file.flows} flows</span>
                    <span style={{ color: file.anomalies && file.anomalies > 0 ? 'var(--critical)' : 'var(--safe)' }}>
                      {file.anomalies} anomalies
                    </span>
                  </div>
                )}
                <span style={{
                  fontSize: 'var(--text-xs)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: `${statusConfig.color}22`,
                  color: statusConfig.color,
                }}>
                  {statusConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}
