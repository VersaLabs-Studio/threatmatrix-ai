'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { api } from '@/lib/api';
import { Upload, FileSearch, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface PCAPUpload {
  id: string;
  filename: string;
  size: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  packets: number | null;
  flows: number | null;
  anomalies: number | null;
  uploaded: string;
  error?: string;
}

interface CaptureStatus {
  status: string;
  packets_total: number;
  flows_total: number;
  anomalies_total: number;
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending:    { icon: Clock,         color: 'var(--text-muted)', label: 'Pending' },
  uploading:  { icon: Loader2,       color: 'var(--cyan)',       label: 'Uploading' },
  processing: { icon: Loader2,       color: 'var(--warning)',    label: 'Processing' },
  complete:   { icon: CheckCircle,   color: 'var(--safe)',       label: 'Complete' },
  error:      { icon: AlertTriangle,  color: 'var(--critical)',   label: 'Error' },
};

export default function ForensicsLabPage() {
  const [uploads, setUploads] = useState<PCAPUpload[]>([]);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch capture status on mount
  const fetchCaptureStatus = useCallback(async () => {
    const { data } = await api.get<CaptureStatus>('/api/v1/capture/status');
    if (data) setCaptureStatus(data);
  }, []);

  // Fetch PCAP upload history
  const fetchUploads = useCallback(async () => {
    const { data } = await api.get<any[]>('/api/v1/capture/uploads');
    if (data && Array.isArray(data)) {
      const formatted: PCAPUpload[] = data.map(u => ({
        id: u.id,
        filename: u.filename,
        size: formatFileSize(Number(u.size)),
        status: u.status,
        packets: u.packets,
        flows: u.flows,
        anomalies: u.anomalies,
        uploaded: new Date(u.uploaded).toLocaleString(),
        error: u.error
      }));
      setUploads(formatted);
    }
  }, []);

  useEffect(() => {
    void fetchCaptureStatus();
    void fetchUploads();
  }, [fetchCaptureStatus, fetchUploads]);

  // Polling for processing uploads
  useEffect(() => {
    const hasProcessing = uploads.some(u => u.status === 'processing' || u.status === 'uploading');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      void fetchUploads();
    }, 3000);

    return () => clearInterval(interval);
  }, [uploads, fetchUploads]);

  // Upload handler
  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;

    const uploadId = crypto.randomUUID();
    const newUpload: PCAPUpload = {
      id: uploadId,
      filename: file.name,
      size: formatFileSize(file.size),
      status: 'uploading',
      packets: null,
      flows: null,
      anomalies: null,
      uploaded: new Date().toLocaleString(),
    };

    setUploads((prev) => [newUpload, ...prev]);
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const { data, error: err } = await api.upload<{
      id: string;
      filename: string;
      packets_processed?: number;
      flows_extracted?: number;
      anomalies_found?: number;
    }>('/api/v1/capture/upload-pcap', formData);

    if (err) {
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: err } : u))
      );
      setError(err);
    } else if (data) {
      // Refresh to get the actual status from DB
      await fetchUploads();
    }

    setUploading(false);
  }, []);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.pcap') || file.name.endsWith('.pcapng'))) {
        void handleUpload(file);
      } else {
        setError('Only .pcap and .pcapng files are supported');
      }
    },
    [handleUpload]
  );

  // File input handler
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Forensics Lab</h1>
          <p className="page-subtitle">PCAP upload and packet analysis</p>
        </div>
        {captureStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span
              className="status-dot"
              style={{ background: captureStatus.status === 'running' ? 'var(--safe)' : 'var(--text-muted)' }}
            />
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Capture: {captureStatus.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--critical-dim)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--critical)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertTriangle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--critical)',
              cursor: 'pointer',
              fontSize: 'var(--text-lg)',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Area */}
      <GlassPanel>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pcap,.pcapng"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={dragActive ? 'drop-zone--active' : ''}
          style={{
            border: `2px dashed ${dragActive ? 'var(--cyan)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <Loader2 size={32} style={{ color: 'var(--cyan)', marginBottom: 'var(--space-3)', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={32} style={{ color: 'var(--cyan)', marginBottom: 'var(--space-3)' }} />
          )}
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
            {uploading ? 'Uploading...' : 'Drop PCAP files here or click to upload'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Supports .pcap and .pcapng files up to 500MB
          </p>
        </div>
      </GlassPanel>

      {/* Upload History */}
      <GlassPanel>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-lg)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <FileSearch size={18} style={{ color: 'var(--cyan)' }} />
          Upload History
        </h2>

        {uploads.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-6)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
            }}
          >
            No uploads yet. Upload a PCAP file to begin analysis.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {uploads.map((file) => {
              const statusConfig = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <StatusIcon
                    size={18}
                    style={{
                      color: statusConfig.color,
                      animation: file.status === 'uploading' || file.status === 'processing' ? 'spin 1s linear infinite' : undefined,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-data)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {file.filename}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {file.size} • Uploaded {file.uploaded}
                    </p>
                  </div>
                  {file.status === 'complete' && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--space-4)',
                        fontFamily: 'var(--font-data)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {file.packets?.toLocaleString() ?? '—'} pkts
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {file.flows ?? '—'} flows
                      </span>
                      <span style={{ color: (file.anomalies ?? 0) > 0 ? 'var(--critical)' : 'var(--safe)' }}>
                        {file.anomalies ?? 0} anomalies
                      </span>
                    </div>
                  )}
                  {file.status === 'error' && file.error && (
                    <span style={{ color: 'var(--critical)', fontSize: 'var(--text-xs)' }}>
                      {file.error}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${statusConfig.color}22`,
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}
