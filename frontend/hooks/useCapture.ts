'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { PCAPUploadResponse } from '@/lib/types';

export function useCapture() {
  const [uploads, setUploads] = useState<PCAPUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.get<PCAPUploadResponse[]>('/api/v1/pcap/uploads');
    if (err) {
      // Gracefully handle 404 (backend route not yet created)
      if (err.includes('404') || err.includes('Not Found')) {
        setUploads([]);
      } else {
        setError(err);
      }
    } else if (data) {
      setUploads(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { uploads, loading, error, refetch: fetch };
}
