'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * AuthGuardWrapper — Production-grade route protection.
 * Redirects to /login if no access token is found in localStorage.
 */
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check for token in localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    
    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/about'];
    const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith('/public'));

    if (!token && !isPublic) {
      console.log(`[AuthGuard] Unauthorized access to ${pathname}, redirecting to /login`);
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Prevent flashing protected content while checking auth
  const publicRoutes = ['/login', '/about'];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith('/public'));

  if (!isAuthorized && !isPublic) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#FF6A00',
        fontFamily: 'monospace'
      }}>
        INITIALIZING SECURE SESSION...
      </div>
    );
  }

  return <>{children}</>;
}
