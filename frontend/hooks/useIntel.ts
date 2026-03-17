'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useIntel Hook (MOCKED)
// Handles IOC searches and Feed synchronization simulation
// ═══════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { MOCK_IOCS, type IOC } from '@/lib/mock-data';

export interface IntelFeed {
  name: string;
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE';
  count: string;
}

interface UseIntelReturn {
  iocs: IOC[];
  loading: boolean;
  syncing: boolean;
  feeds: IntelFeed[];
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

  const [feeds] = useState<IntelFeed[]>([
    { name: 'OTX ALIENVAULT', status: 'ONLINE', count: '1.2M IOCs' },
    { name: 'ABUSEIPDB',      status: 'ONLINE', count: '450K IPs' },
    { name: 'VIRUSTOTAL',     status: 'ONLINE', count: 'Premium' },
    { name: 'INTERNAL',       status: 'STANDBY', count: '842 IOCs' },
  ]);

  return { iocs, loading, syncing, feeds, syncFeeds, searchIOCs };
}
