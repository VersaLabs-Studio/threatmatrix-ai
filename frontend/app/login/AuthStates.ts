// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Authentication States
// ═══════════════════════════════════════════════════════

export type AuthState = 
  | 'idle'              // Initial state, waiting for input
  | 'authenticating'    // Login request in progress
  | 'success'           // Authentication successful, redirecting
  | 'error';            // Authentication failed

export const AUTH_STATE_LABELS: Record<AuthState, string> = {
  idle: 'Idle',
  authenticating: 'Authenticating',
  success: 'Success',
  error: 'Error',
};

export const AUTH_STATE_COLORS: Record<AuthState, string> = {
  idle: 'var(--cyan)',
  authenticating: 'var(--purple)',
  success: 'var(--safe)',
  error: 'var(--critical)',
};
