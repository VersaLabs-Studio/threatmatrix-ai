'use client';

/**
 * AuthGuardWrapper — Route protection (currently disabled for development)
 * Passes all children through without auth checks.
 */
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
