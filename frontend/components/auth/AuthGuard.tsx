'use client';

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if no access token is found
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // TEMP: Auth disabled by request
  return <>{children}</>;
}
