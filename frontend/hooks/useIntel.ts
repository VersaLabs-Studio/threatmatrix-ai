'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DEMO_MODE } from '@/lib/constants';
import { MOCK_IOCS } from '@/lib/mock-data';
import type { IOCResponse } from '@/lib/types';

export function useIntel(filters: { ioc_type?: string } = {}) {
  const [iocs, setIocs] = useState<IOCResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.get<{ items: IOCResponse[]; total: number }>('/api/v1/intel/iocs', filters);
    if (err) {
      // Demo mode: use mock data on error
      if (DEMO_MODE) {
        setIocs(MOCK_IOCS);
        setTotal(MOCK_IOCS.length);
      } else if (err.includes('404') || err.includes('Not Found')) {
        setIocs([]);
        setTotal(0);
      } else {
        setError(err);
      }
    } else if (data) {
      setIocs(data.items || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { iocs, total, loading, error, refetch: fetch };
}
