'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useIntel Hook (MOCKED)
// Handles IOC searches and Feed synchronization simulation
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { MOCK_IOCS, type IOC } from '@/lib/mock-data';

interface UseIntelReturn {
  iocs: IOC[];
  loading: boolean;
  syncing: boolean;
  syncFeeds: () => Promise<void>;
  searchIOCs: (query: string) => IOC[];
}

export function useIntel(): UseIntelReturn {
  const [iocs] = useState<IOC[]>(MOCK_IOCS);
  const [loading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncFeeds = useCallback(async () => {
    setSyncing(true);
    // Simulate complex sync logic with OTX/VT
    await new Promise(resolve => setTimeout(resolve, 2500));
    setSyncing(false);
  }, []);

  const searchIOCs = useCallback((query: string) => {
    if (!query) return iocs;
    const lower = query.toLowerCase();
    return iocs.filter(i => 
      i.indicator.toLowerCase().includes(lower) || 
      i.tags.some(t => t.toLowerCase().includes(lower))
    );
  }, [iocs]);

  return { iocs, loading, syncing, syncFeeds, searchIOCs };
}
