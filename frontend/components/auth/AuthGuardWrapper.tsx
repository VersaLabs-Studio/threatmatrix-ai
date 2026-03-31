'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * AuthGuardWrapper — Client-side route protection
 * Checks for tm_access_token in localStorage.
 * Redirects to /login if missing (except on /login itself).
 */
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('tm_access_token')
      : null;

    if (token) {
      setIsAuthenticated(true);
    } else {
      const isLoginPage = pathname === '/login';
      if (!isLoginPage) {
        router.push('/login');
        return;
      }
    }

    setIsChecking(false);
  }, [router, pathname]);

  // Show nothing while checking auth
  if (isChecking) {
    return null;
  }

  // Login page always renders
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Protected pages render only when authenticated
  return isAuthenticated ? <>{children}</> : null;
}
