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
  daily_summary: 'Daily Summary',
  incident: 'Incident Report',
  executive: 'Executive Briefing',
  ml_performance: 'ML Performance',
};

const TYPE_COLORS: Record<string, string> = {
  daily_summary: 'var(--cyan)',
  incident: 'var(--critical)',
  executive: 'var(--info)',
  ml_performance: 'var(--safe)',
};

const REPORT_TYPES = [
  { key: 'daily_summary', label: 'Daily Summary', description: '24h alerts, top threats, anomaly trends' },
  { key: 'incident', label: 'Incident Report', description: 'Alert details, timeline, affected IPs' },
  { key: 'executive', label: 'Executive Briefing', description: 'High-level threat posture, risk score' },
  { key: 'ml_performance', label: 'ML Performance', description: 'Model comparison, accuracy trends' },
];

interface ReportsListResponse {
  reports: Report[];
  total: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [alertId, setAlertId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch reports on mount
  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await api.get<ReportsListResponse>('/api/v1/reports/');
    if (data && data.reports) {
      setReports(data.reports);
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
      if (reportType === 'incident' && !alertId) {
        setError('Alert ID is required for incident reports');
        return;
      }

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
        alert_id: reportType === 'incident' ? alertId : undefined,
      });

      if (err) {
        setError(err);
      } else if (data) {
        // Refresh report list after generation
        setAlertId('');
        await fetchReports();
      }

      setGenerating(false);
      setSelectedType(null);
    },
    [fetchReports, alertId]
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

            {type.key === 'incident' && (
              <input
                type="text"
                placeholder="Enter Alert ID..."
                value={alertId}
                onChange={(e) => setAlertId(e.target.value)}
                style={{
                  marginTop: 'var(--space-3)',
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-data)',
                  outline: 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}

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
                  display: 'grid',
                  gridTemplateColumns: 'min-content 1fr 180px 100px',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: `${TYPE_COLORS[report.report_type] || 'var(--cyan)'}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: TYPE_COLORS[report.report_type] || 'var(--cyan)'
                }}>
                  <FileText size={18} />
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 2, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {report.title || `${TYPE_LABELS[report.report_type] || report.report_type} Report`}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ID: {report.id.slice(0, 8)}...
                  </p>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    {new Date(report.generated_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                    {new Date(report.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => void handleDownload(report.id, report.title || 'report')}
                    disabled={report.status !== 'complete'}
                    className="btn-aether"
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      width: '100%',
                      justifyContent: 'center',
                      opacity: report.status === 'complete' ? 1 : 0.5
                    }}
                  >
                    {report.status === 'complete' ? (
                      <>
                        <Download size={14} /> PDF
                      </>
                    ) : (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                      </>
                    )}
                  </button>
                </div>
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
