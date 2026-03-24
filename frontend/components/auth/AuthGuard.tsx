'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if no access token is found
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
      // No token found, redirect to login
      router.push('/login');
      return;
    }

    setIsChecking(false);
  }, [router]);

  // Show nothing while checking auth
  if (isChecking) {
    return null;
  }

  // Render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
