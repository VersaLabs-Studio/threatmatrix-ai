'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — DataTable (shared)
// Sortable, filterable data table for flows/alerts
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  maxHeight?: number | string;
  rowClassName?: (row: T) => string;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T extends any>({
  columns, data, loading, rowKey, onRowClick, emptyMessage = 'No data', maxHeight = 400, rowClassName,
}: DataTableProps<T>) {
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<SortDir>(null);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === 'asc' ? -1 : 1;
      if (bv == null) return sortDir === 'asc' ? 1 : -1;
      const order = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
      return sortDir === 'asc' ? order : -order;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc')  { setSortDir('desc'); return; }
    setSortKey(null); setSortDir(null);
  };

  return (
    <div style={{ overflowY: 'auto', maxHeight, borderRadius: 'var(--radius-sm)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderBottom: '1px solid var(--border)',
                  cursor: col.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
                {sortKey === col.key && (
                  <span style={{ marginLeft: 4, color: 'var(--cyan)' }}>
                    {sortDir === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} style={{ padding: '10px 12px' }}>
                      <div className="skeleton" style={{ height: 13, width: `${55 + Math.random() * 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.length === 0
              ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{
                        padding: '2rem',
                        textAlign: 'center',
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )
              : sorted.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`table-row ${rowClassName ? rowClassName(row) : ''}`}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background-color var(--transition-fast)' }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid var(--border)',
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}
