'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { SystemHealth } from '@/lib/types';

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.get<SystemHealth>('/api/v1/system/health');
    if (err) {
      setError(err);
    } else if (data) {
      setHealth(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetch();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      void fetch();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { health, loading, error, refetch: fetch };
}
