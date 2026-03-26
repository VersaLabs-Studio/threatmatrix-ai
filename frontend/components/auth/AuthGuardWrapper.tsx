'use client';

/**
 * AuthGuardWrapper - Conditionally wraps children with AuthGuard
 * Used in root layout to protect all pages except login
 */
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  // TEMP: Auth disabled by request
  return <>{children}</>;
}
