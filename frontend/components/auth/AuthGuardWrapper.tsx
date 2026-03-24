'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

/**
 * AuthGuardWrapper - Conditionally wraps children with AuthGuard
 * Used in root layout to protect all pages except login
 */
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for access token in localStorage
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('tm_access_token') 
      : null;

    if (token) {
      setIsAuthenticated(true);
    } else {
      // No token found, redirect to login if not on login page
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

  // On login page, always render children
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // For protected pages, render only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
