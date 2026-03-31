'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { FileText, Download, Calendar, Clock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  report_type: string;
  format: string;
  file_path?: string;
  file_size?: number;
  status: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Summary',
  incident: 'Incident Report',
  executive: 'Executive Briefing',
  ml_performance: 'ML Performance',
};

const TYPE_COLORS: Record<string, string> = {
  daily: 'var(--cyan)',
  incident: 'var(--critical)',
  executive: 'var(--info)',
  ml_performance: 'var(--safe)',
};

const REPORT_TYPES = [
  { key: 'daily', label: 'Daily Summary', description: '24h alerts, top threats, anomaly trends' },
  { key: 'incident', label: 'Incident Report', description: 'Alert details, timeline, affected IPs' },
  { key: 'executive', label: 'Executive Briefing', description: 'High-level threat posture, risk score' },
  { key: 'ml_performance', label: 'ML Performance', description: 'Model comparison, accuracy trends' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports on mount
  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Report[]>('/api/v1/reports/');
    if (data && Array.isArray(data)) {
      setReports(data);
    } else if (err && !err.includes('404')) {
      setError(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  // Generate a new report
  const handleGenerate = useCallback(
    async (reportType: string) => {
      setGenerating(true);
      setSelectedType(reportType);
      setError(null);

      const { data, error: err } = await api.post<{
        id: string;
        title?: string;
        report_type: string;
        status: string;
      }>('/api/v1/reports/generate', {
        report_type: reportType,
        format: 'pdf',
      });

      if (err) {
        setError(err);
      } else if (data) {
        // Refresh report list after generation
        await fetchReports();
      }

      setGenerating(false);
      setSelectedType(null);
    },
    [fetchReports]
  );

  // Download a report
  const handleDownload = useCallback(async (reportId: string, title: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/${reportId}/download`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9- ]/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">PDF report generation and history</p>
        </div>
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

      {/* Report Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {REPORT_TYPES.map((type) => (
          <GlassPanel
            key={type.key}
            style={{
              textAlign: 'center',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating && selectedType !== type.key ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: TYPE_COLORS[type.key],
                margin: '0 auto var(--space-2)',
              }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600, display: 'block' }}>
              {type.label}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              {type.description}
            </span>
            <button
              onClick={() => void handleGenerate(type.key)}
              disabled={generating}
              className="btn-aether"
              style={{
                marginTop: 'var(--space-3)',
                width: '100%',
                fontSize: 'var(--text-xs)',
              }}
            >
              {generating && selectedType === type.key ? (
                <>
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generating...
                </>
              ) : (
                <>
                  <FileText size={12} /> Generate
                </>
              )}
            </button>
          </GlassPanel>
        ))}
      </div>

      {/* Reports List */}
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
          <Calendar size={18} style={{ color: 'var(--cyan)' }} />
          Generated Reports
        </h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 60, borderRadius: 'var(--radius-md)' }}
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-6)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
            }}
          >
            No reports generated yet. Select a report type above to generate one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {reports.map((report) => (
              <div
                key={report.id}
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
                <FileText size={20} style={{ color: TYPE_COLORS[report.report_type] || 'var(--cyan)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
                    {report.title || `${TYPE_LABELS[report.report_type] || report.report_type} Report`}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(report.created_at).toLocaleString()}
                    </span>
                    {report.file_size && <span>{formatFileSize(report.file_size)}</span>}
                    <span style={{ color: TYPE_COLORS[report.report_type] || 'var(--cyan)' }}>
                      {TYPE_LABELS[report.report_type] || report.report_type}
                    </span>
                  </div>
                </div>
                {report.status === 'complete' || report.file_path ? (
                  <button
                    onClick={() => void handleDownload(report.id, report.title || 'report')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Download size={14} /> PDF
                  </button>
                ) : (
                  <span style={{ color: 'var(--warning)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Generating...
                  </span>
                )}
              </div>
            ))}
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
