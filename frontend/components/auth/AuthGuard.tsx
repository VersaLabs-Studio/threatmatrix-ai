'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_MODE } from '@/lib/constants';

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if no access token is found
 * In demo mode, always authorized
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Demo mode: always authorized, set fake token
    if (DEMO_MODE) {
      if (typeof window !== 'undefined' && !localStorage.getItem('tm_access_token')) {
        localStorage.setItem('tm_access_token', 'demo_token');
      }
      setIsAuthorized(true);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    
    if (!token) {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
