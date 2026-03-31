'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { DataTable } from '@/components/shared/DataTable';
import { useFlows } from '@/hooks/useFlows';
import { formatTime, formatBytes } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';
import { api } from '@/lib/api';
import type { NetworkFlow } from '@/hooks/useFlows';
import { Search, Download, Bot, Filter, Loader2 } from 'lucide-react';

export default function ThreatHuntPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [protocol, setProtocol] = useState('all');
  const [minScore, setMinScore] = useState('');
  const [searchResults, setSearchResults] = useState<NetworkFlow[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Live flows from API
  const { flows, loading } = useFlows({ time_range: '1h', limit: 100 });

  // Display results: search results if available, otherwise live flows
  const displayFlows = searchResults ?? flows;

  // Filter by protocol and score locally
  const filtered = displayFlows.filter((f) => {
    const matchProtocol = protocol === 'all' || f.protocol === protocol;
    const matchScore = !minScore || (f.anomaly_score ?? 0) >= parseFloat(minScore);
    const matchSearch =
      !search ||
      f.src_ip.includes(search) ||
      f.dst_ip.includes(search) ||
      (f.label ?? '').toLowerCase().includes(search.toLowerCase());
    return matchProtocol && matchScore && matchSearch;
  });

  // Search against API
  const handleSearch = useCallback(async () => {
    if (!search && protocol === 'all' && !minScore) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    const query: Record<string, string | number | undefined> = {};
    if (search) {
      // Try as source IP first
      query.src_ip = search;
    }
    if (protocol !== 'all') query.protocol = protocol === 'TCP' ? '6' : protocol === 'UDP' ? '17' : protocol === 'ICMP' ? '1' : undefined;
    if (minScore) query.min_score = parseFloat(minScore);
    query.limit = 200;

    const { data } = await api.get<{ items: NetworkFlow[] }>('/api/v1/flows/', query);
    if (data?.items) {
      setSearchResults(data.items);
    }
    setSearching(false);
  }, [search, protocol, minScore]);

  // Auto-search on Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') void handleSearch();
    },
    [handleSearch]
  );

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) return;

    const headers = ['Time', 'Source IP', 'Dest IP', 'Protocol', 'Bytes', 'Anomaly Score', 'Label'];
    const rows = filtered.map((f) => [
      formatTime(f.timestamp),
      f.src_ip,
      f.dst_ip,
      f.protocol,
      (f.src_bytes ?? 0) + (f.dst_bytes ?? 0),
      f.anomaly_score?.toFixed(4) ?? '',
      f.label ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-hunt-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [filtered]);

  // Analyze with AI
  const handleAnalyzeWithAI = useCallback(() => {
    const query = search || 'suspicious activity';
    router.push(`/ai-analyst?q=${encodeURIComponent(query)}`);
  }, [search, router]);

  const COLUMNS = [
    {
      key: 'timestamp',
      header: 'TIME',
      width: 90,
      render: (r: NetworkFlow) => (
        <span style={{ fontFamily: 'var(--font-data)', color: 'var(--text-muted)' }}>{formatTime(r.timestamp)}</span>
      ),
    },
    { key: 'src_ip', header: 'SOURCE IP', width: 140, render: (r: NetworkFlow) => <code style={{ color: 'var(--cyan)' }}>{r.src_ip}</code> },
    { key: 'dst_ip', header: 'DEST IP', width: 140, render: (r: NetworkFlow) => <code style={{ color: 'var(--text-secondary)' }}>{r.dst_ip}</code> },
    { key: 'protocol', header: 'PROTO', width: 70, render: (r: NetworkFlow) => <span style={{ fontWeight: 600 }}>{r.protocol}</span> },
    {
      key: 'bytes',
      header: 'BYTES',
      width: 90,
      render: (r: NetworkFlow) => (
        <span style={{ fontFamily: 'var(--font-data)' }}>{formatBytes((r.src_bytes ?? 0) + (r.dst_bytes ?? 0))}</span>
      ),
    },
    {
      key: 'anomaly_score',
      header: 'SCORE',
      width: 80,
      render: (r: NetworkFlow) => {
        const score = r.anomaly_score ?? 0;
        return (
          <span
            style={{
              fontFamily: 'var(--font-data)',
              color: score > 0.8 ? 'var(--critical)' : score > 0.5 ? 'var(--warning)' : 'var(--safe)',
              fontWeight: 700,
            }}
          >
            {(score * 100).toFixed(0)}%
          </span>
        );
      },
    },
    {
      key: 'label',
      header: 'LABEL',
      width: 120,
      render: (r: NetworkFlow) => {
        const score = r.anomaly_score ?? 0;
        return (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: 4,
              background: score > 0.8 ? 'var(--critical-dim)' : score > 0.5 ? 'var(--warning-dim)' : 'var(--info-dim)',
              color: score > 0.8 ? 'var(--critical)' : score > 0.5 ? 'var(--warning)' : 'var(--info)',
            }}
          >
            {r.label || 'Normal'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Threat Hunt</h1>
          <p className="page-subtitle">Query builder and flow search analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn-aether"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            style={{ opacity: filtered.length === 0 ? 0.5 : 1 }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn-aether"
            onClick={handleAnalyzeWithAI}
            style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
          >
            <Bot size={14} /> Analyze with AI
          </button>
        </div>
      </div>

      {/* Query Builder */}
      <GlassPanel>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                border: '1px solid var(--border)',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by IP, label..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '100%',
                  fontFamily: 'var(--font-ui)',
                }}
              />
            </div>
          </div>

          {/* Min Score */}
          <div style={{ width: 120 }}>
            <input
              type="number"
              placeholder="Min score"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              min="0"
              max="1"
              step="0.1"
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-data)',
                fontSize: 'var(--text-sm)',
              }}
            />
          </div>

          {/* Protocol filter */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['all', 'TCP', 'UDP', 'ICMP'].map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${protocol === p ? 'var(--cyan)' : 'var(--border)'}`,
                  background: protocol === p ? 'var(--cyan-dim)' : 'transparent',
                  color: protocol === p ? 'var(--cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search button */}
          <button
            className="btn-aether"
            onClick={() => void handleSearch()}
            disabled={searching}
            style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
          >
            {searching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
            Hunt
          </button>

          {/* Reset */}
          <button
            className="btn-aether"
            onClick={() => {
              setSearch('');
              setProtocol('all');
              setMinScore('');
              setSearchResults(null);
            }}
          >
            Reset
          </button>
        </div>
      </GlassPanel>

      {/* Results */}
      <GlassPanel>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} />
            {filtered.length} flows matching
            {searchResults !== null && (
              <span style={{ color: 'var(--cyan)', fontSize: 'var(--text-xs)' }}>(API search results)</span>
            )}
          </span>
        </div>
        <DataTable
          columns={COLUMNS}
          data={filtered}
          loading={loading || searching}
          rowKey={(row: NetworkFlow) => String(row.id)}
          emptyMessage="No flows match the current filters"
          maxHeight={400}
          rowClassName={(r: NetworkFlow) => (r.is_anomaly ? 'flow-row-anomaly' : '')}
        />
      </GlassPanel>
    </div>
  );
}
