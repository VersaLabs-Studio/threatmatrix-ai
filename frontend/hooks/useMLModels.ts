'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { MLModelResponse } from '@/lib/types';

export function useMLModels() {
  const [models, setModels] = useState<MLModelResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.get<{ items: MLModelResponse[]; total: number }>('/api/v1/ml/models');
    if (err) {
      // Gracefully handle 404 (backend route not yet created)
      if (err.includes('404') || err.includes('Not Found')) {
        setModels([]);
        setTotal(0);
      } else {
        setError(err);
      }
    } else if (data) {
      setModels(data.items || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { models, total, loading, error, refetch: fetch };
}
