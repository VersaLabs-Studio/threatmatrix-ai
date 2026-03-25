'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { MLModelDetail, MLModelsResponse } from '@/lib/types';

export function useMLModels() {
  const [models, setModels] = useState<MLModelDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.get<MLModelsResponse>('/api/v1/ml/models');
    if (err) {
      // Gracefully handle 404 (backend route not yet created)
      if (err.includes('404') || err.includes('Not Found')) {
        setModels([]);
      } else {
        setError(err);
      }
    } else if (data?.models) {
      setModels(data.models);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const trainedCount = models.filter(m => m.trained).length;

  return { models, trainedCount, loading, error, refetch: fetch };
}