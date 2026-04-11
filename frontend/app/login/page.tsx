'use client';

// ═══════════════════════════════════════════════════════════════════
// ThreatMatrix AI — Tactical HUD Login Page
// Immersive military-grade interface with real-time telemetry, 
// scanlines, and biometric authentication animations.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

// ═══════════════════════════════════════════════════════
// Components & Sub-elements
// ═══════════════════════════════════════════════════════

/**
 * ScanlineEffect — Horizontal glowing sweep
 */
const ScanlineEffect = () => (
  <motion.div
    initial={{ translateY: '-100%' }}
    animate={{ translateY: '200vh' }}
    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    style={{
      position: 'absolute',
      left: 0,
      width: '100%',
      height: '100px',
      background: 'linear-gradient(to bottom, transparent, rgba(255,106,0,0.05), rgba(255,106,0,0.15), rgba(255,106,0,0.05), transparent)',
      zIndex: 5,
      pointerEvents: 'none',
    }}
  />
);

/**
 * TelemetryPanel — Sidebar with scrolling data
 */
const TelemetryPanel = ({ side }: { side: 'left' | 'right' }) => {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    const generateLine = () => {
      const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
      const status = ['OK', 'SECURE', 'WAIT', 'SCAN'][Math.floor(Math.random() * 4)];
      const id = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      return `TRX-${id} | 0x${hex} | ${status} | ${Math.random().toFixed(4)}`;
    };

    const interval = setInterval(() => {
      setData(prev => [generateLine(), ...prev].slice(0, 30));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      [side]: 20,
      height: '100%',
      width: '200px',
      padding: '40px 0',
      overflow: 'hidden',
      zIndex: 3,
      opacity: 0.4,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      color: '#FF6A00',
      pointerEvents: 'none',
      maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
    }}>
      {data.map((line, i) => (
        <motion.div 
          key={`${side}-${i}`}
          initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: '4px', whiteSpace: 'nowrap' }}
        >
          {line}
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  const canSubmit = email.length > 0 && password.length > 0 && authState === 'idle';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setApiError(null);
    setAuthState('authenticating');

    try {
      const res = await api.post<{ access_token: string; refresh_token: string }>(
        '/api/v1/auth/login',
        { email, password },
      );
      if (res.data) {
        api.setTokens(res.data.access_token, res.data.refresh_token);
        setAuthState('success');
        setTimeout(() => router.push('/war-room'), 1500);
      } else {
        throw new Error(res.error || 'Authentication failed');
      }
    } catch (err: unknown) {
      setAuthState('error');
      const m = err instanceof Error ? err.message : 'Unknown error';
      setApiError(m.includes('401') ? 'Access denied. Verify credentials.' : m);
      setTimeout(() => setAuthState('idle'), 3000);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#04040a',
      color: '#f0f0f0',
      fontFamily: '"Inter", sans-serif',
    }}>
      {/* ── Background Layer: HUD Grid ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        backgroundImage: `
          radial-gradient(circle at center, rgba(255,106,0,0.03) 0%, transparent 70%),
          repeating-linear-gradient(0deg, rgba(255,106,0,0.03) 0px, rgba(255,106,0,0.03) 1px, transparent 1px, transparent 100px),
          repeating-linear-gradient(90deg, rgba(255,106,0,0.03) 0px, rgba(255,106,0,0.03) 1px, transparent 1px, transparent 100px)
        `,
        pointerEvents: 'none',
      }} />

      {/* ── HUD Effects ── */}
      <ScanlineEffect />
      <TelemetryPanel side="left" />
      <TelemetryPanel side="right" />

      {/* ── Decorative HUD Corners ── */}
      <div style={{ position: 'absolute', inset: 30, pointerEvents: 'none', zIndex: 4, border: '1px solid rgba(255,106,0,0.1)' }}>
        {[
          { t: -1, l: -1 }, { t: -1, r: -1 }, { b: -1, l: -1 }, { b: -1, r: -1 }
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 30,
            height: 30,
            borderStyle: 'solid',
            borderColor: '#FF6A00',
            borderWidth: `${(pos as any).t ? '2px 0 0 2px' : ''} ${(pos as any).b ? '0 2px 2px 0' : ''} ${(pos as any).l ? '2px 0 0 2px' : ''} ${(pos as any).r ? '0 2px 2px 0' : ''}`.trim() as any,
            ...pos
          }} />
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            width: '420px',
            background: 'rgba(5, 5, 10, 0.85)',
            backdropFilter: 'blur(30px) saturate(1.5)',
            border: '1px solid rgba(255,106,0,0.2)',
            borderRadius: '2px',
            padding: '40px',
            boxShadow: '0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,106,0,0.05)',
            clipPath: 'polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)',
          }}
        >
          {/* ── Branding ── */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <h1 style={{
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '10px',
                margin: 0,
                color: '#FF6A00',
                textShadow: '0 0 10px rgba(255,106,0,0.5)',
              }}>THREATMATRIX</h1>
              <div style={{
                fontSize: '10px',
                letterSpacing: '4px',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '10px',
                textTransform: 'uppercase'
              }}>{t('Login.tacticalDefenseCommand')}</div>
            </motion.div>
            
            <div style={{ 
              width: '100%', 
              height: '1px', 
              background: 'linear-gradient(90deg, transparent, rgba(255,106,0,0.4), transparent)', 
              margin: '20px 0' 
            }} />
          </div>

          {/* ── Login Form ── */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,106,0,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                {t('Login.operatorId')}
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ID-000000"
                style={{
                  width: '100%',
                  background: 'rgba(255,106,0,0.03)',
                  border: '1px solid rgba(255,106,0,0.15)',
                  padding: '12px 15px',
                  color: '#fff',
                  fontFamily: '"JetBrains Mono", monospace',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                }}
              />
            </div>

            <div style={{ marginBottom: '35px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,106,0,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                {t('Login.secureAccessCode')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(255,106,0,0.03)',
                  border: '1px solid rgba(255,106,0,0.15)',
                  padding: '12px 15px',
                  color: '#fff',
                  fontFamily: '"JetBrains Mono", monospace',
                  outline: 'none',
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    color: '#ff4d4d',
                    fontSize: '12px',
                    marginBottom: '20px',
                    background: 'rgba(255,77,77,0.1)',
                    padding: '10px',
                    border: '1px solid rgba(255,77,77,0.3)',
                    fontFamily: 'monospace'
                  }}
                >
                  {t('Login.systemError')}: {apiError.toUpperCase()}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%',
                padding: '15px',
                background: authState === 'success' ? '#22c55e' : (canSubmit ? '#FF6A00' : 'rgba(255,106,0,0.2)'),
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '5px',
                textTransform: 'uppercase',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                clipPath: 'polygon(0 0, 90% 0, 100% 30%, 100% 100%, 10% 100%, 0 70%)',
              }}
            >
              {authState === 'authenticating' ? t('Login.validating') : (authState === 'success' ? t('Login.granted') : t('Login.initialize'))}
            </button>
          </form>

          {/* ── Footer Stats ── */}
          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.3, fontSize: '9px', fontFamily: '"JetBrains Mono", monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('Login.secureLinkActive')}</span>
              <span>{t('Login.node')}</span>
            </div>
            <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,106,0,0.1)', letterSpacing: '2px' }}>
              THREATMATRIX v1.0.0 -- {t('Login.threatmatrixCommandCenter')}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Biometric Scan Animation (overlay when authenticating) ── */}
      <AnimatePresence>
        {authState === 'authenticating' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 100,
              background: 'rgba(4, 4, 10, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '150px',
                height: '150px',
                border: '2px dashed #FF6A00',
                borderRadius: '50%',
                position: 'relative'
              }}
            >
               <div style={{ position: 'absolute', inset: '10px', border: '1px solid rgba(255,106,0,0.3)', borderRadius: '50%' }} />
            </motion.div>
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ marginTop: '30px', color: '#FF6A00', letterSpacing: '8px', fontSize: '14px', fontWeight: 800 }}
            >
              {t('Login.scanningBiometrics')}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
