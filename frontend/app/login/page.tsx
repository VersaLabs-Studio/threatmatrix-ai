'use client';

// ═══════════════════════════════════════════════════════════════════
// ThreatMatrix AI — Immersive Login Page
// Complete single-file component: 3D space background, shooting stars,
// war-room tactical overlay, glassmorphic login card
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  speed: number;
  drift: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: 0 | 1 | 2;
}

interface ShootingStarData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tailLength: number;
  life: number;
  maxLife: number;
  isDramatic: boolean;
  coreSize: number;
}

type AuthState = 'idle' | 'authenticating' | 'success' | 'error';

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════

const RADAR_PINGS = [
  { x: 15, y: 20, duration: 4 },
  { x: 82, y: 12, duration: 5.5 },
  { x: 22, y: 58, duration: 3.5 },
  { x: 78, y: 72, duration: 6.5 },
  { x: 45, y: 85, duration: 7 },
];

const CONNECTIONS: [number, number][] = [
  [0, 2],
  [1, 3],
  [2, 4],
  [0, 1],
];

// ═══════════════════════════════════════════════════════
// Injected CSS — Keyframes, pseudo-elements, media queries
// ═══════════════════════════════════════════════════════

const INJECTED_CSS = `
/* Card entry float-up */
@keyframes tm-cardEntry {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Brand name pulsing glow (orange text-shadow oscillation) */
@keyframes tm-brandGlow {
  0%, 100% {
    text-shadow:
      0 0 20px rgba(255,106,0,0.3),
      0 0 40px rgba(255,106,0,0.15);
  }
  50% {
    text-shadow:
      0 0 20px rgba(255,106,0,0.6),
      0 0 40px rgba(255,106,0,0.3),
      0 0 60px rgba(255,106,0,0.1);
  }
}

/* Radar concentric circle expansion */
@keyframes tm-radarPing {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

/* Connection line dash flow */
@keyframes tm-dashFlow {
  to { stroke-dashoffset: -14; }
}

/* Button shimmer sweep */
@keyframes tm-shimmer {
  0%, 70% { transform: translateX(-100%); }
  100%    { transform: translateX(100%); }
}

/* Dramatic shooting star ambient flash */
@keyframes tm-ambientFlash {
  0%   { background: rgba(255,106,0,0.03); }
  50%  { background: rgba(255,106,0,0.02); }
  100% { background: transparent; }
}

/* Auth spinner rotation */
@keyframes tm-spinnerRotate {
  to { transform: rotate(360deg); }
}

/* Placeholder color for dark inputs */
.tm-login-card input::placeholder {
  color: rgba(255,255,255,0.2);
}

/* Focus-visible outlines for accessibility */
.tm-login-card input:focus-visible,
.tm-login-card button:focus-visible,
.tm-login-card a:focus-visible {
  outline: 2px solid rgba(255,106,0,0.6);
  outline-offset: 2px;
}

/* Remove default focus ring (replaced by focus-visible above) */
.tm-login-card input:focus {
  outline: none;
}

/* Responsive — narrow viewports */
@media (max-width: 500px) {
  .tm-login-card {
    width: calc(100% - 40px) !important;
    max-width: none !important;
    padding: 25px !important;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// ═══════════════════════════════════════════════════════
// Helpers — Star field generation
// ═══════════════════════════════════════════════════════

function createStars(w: number, h: number): Star[] {
  const stars: Star[] = [];

  // Layer 0 — Distant: 280 tiny dim stars, very slow Earth rotation
  for (let i = 0; i < 280; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.02 + Math.random() * 0.03; // Very slow rotation
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 0.3 + Math.random() * 0.4,
      baseOpacity: 0.15 + Math.random() * 0.15,
      speed: radius * Math.cos(angle) * 0.08,
      drift: radius * Math.sin(angle) * 0.04,
      twinkleSpeed: 0.3 + Math.random() * 0.5,
      twinklePhase: Math.random() * Math.PI * 2,
      layer: 0,
    });
  }

  // Layer 1 — Mid: 150 moderate stars, medium rotation, gentle twinkling
  for (let i = 0; i < 150; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.04 + Math.random() * 0.06; // Medium rotation
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 0.6 + Math.random() * 0.6,
      baseOpacity: 0.25 + Math.random() * 0.2,
      speed: radius * Math.cos(angle) * 0.12,
      drift: radius * Math.sin(angle) * 0.06,
      twinkleSpeed: 0.5 + Math.random() * 1.2,
      twinklePhase: Math.random() * Math.PI * 2,
      layer: 1,
    });
  }

  // Layer 2 — Foreground: 80 brighter larger stars, faster rotation
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.06 + Math.random() * 0.1; // Faster rotation
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 1 + Math.random() * 1.2,
      baseOpacity: 0.4 + Math.random() * 0.25,
      speed: radius * Math.cos(angle) * 0.18,
      drift: radius * Math.sin(angle) * 0.09,
      twinkleSpeed: 0.8 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      layer: 2,
    });
  }

  return stars;
}

// ═══════════════════════════════════════════════════════
// Helpers — Shooting star spawning
// ═══════════════════════════════════════════════════════

function spawnShootingStar(
  w: number,
  h: number,
  dramatic: boolean,
): ShootingStarData {
  // Originate from top edge (60%) or upper-right edge (40%)
  const fromTop = Math.random() > 0.4;
  const startX = fromTop ? w * 0.3 + Math.random() * w * 0.7 : w + 5;
  const startY = fromTop ? -5 : Math.random() * h * 0.3;

  // Travel angle 15-45° below horizontal (down-left)
  const angleDeg = 15 + Math.random() * 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const speed = dramatic ? 8 + Math.random() * 4 : 14 + Math.random() * 8;

  // Life in frames: dramatic ~1.5s, normal 0.8-1.5s at 60fps
  const life = dramatic ? 90 : 48 + Math.floor(Math.random() * 42);

  return {
    x: startX,
    y: startY,
    vx: -Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,
    tailLength: dramatic ? 250 : 150 + Math.random() * 100,
    life,
    maxLife: life,
    isDramatic: dramatic,
    coreSize: dramatic ? 3 : 1.5 + Math.random(),
  };
}

// ═══════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();

  // Canvas & animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootRef = useRef<ShootingStarData[]>([]);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const flashRef = useRef<HTMLDivElement>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  // UI interaction state (needed for inline style pseudo-class equivalents)
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);
  const [forgotHover, setForgotHover] = useState(false);

  const canSubmit =
    email.length > 0 && password.length > 0 && authState === 'idle';

  // ─── CSS Keyframes Injection ───────────────────────
  useEffect(() => {
    const id = 'tm-login-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = INJECTED_CSS;
      document.head.appendChild(el);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  // ─── Canvas: Star Field + Shooting Stars ───────────
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = w + 'px';
      cvs.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    // ── Animation loop (60fps target) ──
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      timeRef.current += 0.016;
      const t = timeRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // ── Draw star field (3 layers) ──
      for (const s of starsRef.current) {
        // Drift downward with slight horizontal wander
        s.y += s.speed;
        s.x += s.drift;

        // Wrap around viewport edges
        if (s.y > h + 5) {
          s.y = -5;
          s.x = Math.random() * w;
        }
        if (s.x > w + 5) s.x = -5;
        if (s.x < -5) s.x = w + 5;

        // Twinkling (mid + foreground layers)
        let op = s.baseOpacity;
        if (s.twinkleSpeed > 0) {
          op += Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.2;
          op = Math.max(0.1, Math.min(1, op));
        }

        // Star dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${op})`;
        ctx.fill();

        // Foreground stars get a soft glow halo
        if (s.layer === 2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${op * 0.12})`;
          ctx.fill();
        }
      }

      // ── Draw shooting stars ──
      const ssList = shootRef.current;
      for (let i = ssList.length - 1; i >= 0; i--) {
        const ss = ssList[i];
        ss.life--;

        // Remove when fully faded (30 extra frames for afterglow)
        if (ss.life <= -30) {
          ssList.splice(i, 1);
          continue;
        }

        const isAfterglow = ss.life <= 0;
        const afterFade = isAfterglow
          ? Math.max(0, (30 + ss.life) / 30)
          : 1;
        const fadeIn = Math.min(1, (ss.maxLife - ss.life) / 10);
        const masterAlpha = fadeIn * afterFade;

        // Only move during active phase
        if (!isAfterglow) {
          ss.x += ss.vx;
          ss.y += ss.vy;
        }

        // Remove if off-screen
        if (ss.x < -300 || ss.y > h + 300 || ss.x > w + 300) {
          ssList.splice(i, 1);
          continue;
        }

        // ── Tail: color-graded segments ──
        const backAngle = Math.atan2(-ss.vy, -ss.vx);
        const segments = 40;
        for (let j = 0; j < segments; j++) {
          const p = j / segments; // 0 = head, 1 = tail tip
          const tx = ss.x + Math.cos(backAngle) * ss.tailLength * p;
          const ty = ss.y + Math.sin(backAngle) * ss.tailLength * p;
          const segOp = (1 - p) * masterAlpha * 0.8;
          const segSize = ss.coreSize * (1 - p * 0.8);

          // Color transition: white → #FF6A00 → #FF8C00 → fading red-orange
          let r = 255,
            g: number,
            b: number;
          if (p < 0.2) {
            const f = p / 0.2;
            g = Math.round(255 - 149 * f);
            b = Math.round(255 * (1 - f));
          } else if (p < 0.5) {
            const f = (p - 0.2) / 0.3;
            g = Math.round(106 + 34 * f);
            b = 0;
          } else {
            const f = (p - 0.5) / 0.5;
            g = Math.round(140 - 100 * f);
            b = 0;
          }

          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(0.3, segSize), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${segOp})`;
          ctx.fill();
        }

        // Head elements (only during active phase)
        if (!isAfterglow) {
          // Outer glow (15-20px radius)
          const glowR = ss.isDramatic ? 20 : 15;
          const grd = ctx.createRadialGradient(
            ss.x,
            ss.y,
            0,
            ss.x,
            ss.y,
            glowR,
          );
          grd.addColorStop(0, `rgba(255,106,0,${0.4 * masterAlpha})`);
          grd.addColorStop(0.5, `rgba(255,140,0,${0.15 * masterAlpha})`);
          grd.addColorStop(1, 'rgba(255,106,0,0)');
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          // White-hot core
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.coreSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.95 * masterAlpha})`;
          ctx.fill();

          // Inner warm glow
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, ss.coreSize * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,200,150,${0.4 * masterAlpha})`;
          ctx.fill();
        }
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ─── Shooting Star Spawner ─────────────────────────
  useEffect(() => {
    let active = true;

    const spawnRegular = () => {
      if (!active) return;
      shootRef.current.push(
        spawnShootingStar(window.innerWidth, window.innerHeight, false),
      );
      setTimeout(spawnRegular, 3000 + Math.random() * 3000);
    };

    const spawnDramatic = () => {
      if (!active) return;
      shootRef.current.push(
        spawnShootingStar(window.innerWidth, window.innerHeight, true),
      );
      // Trigger ambient flash
      if (flashRef.current) {
        flashRef.current.style.animation = 'none';
        void flashRef.current.offsetHeight; // force reflow
        flashRef.current.style.animation =
          'tm-ambientFlash 0.5s ease-out forwards';
      }
      setTimeout(spawnDramatic, 15000 + Math.random() * 5000);
    };

    // Initial delays
    setTimeout(spawnRegular, 1500);
    setTimeout(spawnDramatic, 12000 + Math.random() * 8000);

    return () => {
      active = false;
    };
  }, []);

  // ─── Keyboard: Escape to reset ─────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authState !== 'idle') {
        setAuthState('idle');
        setApiError(null);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [authState]);

  // ─── Form Submission ───────────────────────────────
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
      const m = err instanceof Error ? err.message : '';
      if (m.includes('401') || m.includes('Invalid'))
        setApiError('Access denied. Verify your credentials.');
      else if (m.includes('429'))
        setApiError('Too many attempts. Wait 60 seconds.');
      else if (m.includes('Network') || m.includes('fetch'))
        setApiError('Cannot reach server. Check connection.');
      else setApiError(m || 'Authentication failed');
      setTimeout(() => setAuthState('idle'), 3000);
    }
  };

  // ═══════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      } as React.CSSProperties}
    >
      {/* ══════════════════════════════════════════════════
          Layer 0 — Cosmic Nebula Gradient Background
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: [
            'radial-gradient(ellipse at 30% 20%, rgba(18,18,48,0.8) 0%, transparent 70%)',
            'radial-gradient(ellipse at 80% 80%, rgba(26,15,10,0.6) 0%, transparent 60%)',
            'linear-gradient(180deg, #0a0a1a 0%, #121230 50%, #1a0f0a 100%)',
          ].join(', '),
        }}
      />

      {/* ══════════════════════════════════════════════════
          Layer 1 — Nebula Cloud Shapes (warm orange radials)
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: [
            'radial-gradient(ellipse 600px 400px at 20% 25%, rgba(255,106,0,0.04) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 350px at 75% 55%, rgba(255,140,0,0.03) 0%, transparent 70%)',
            'radial-gradient(ellipse 450px 300px at 55% 80%, rgba(255,106,0,0.035) 0%, transparent 65%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />

      {/* ══════════════════════════════════════════════════
          Layer 2 — Canvas: Parallax Star Field + Shooting Stars
          ══════════════════════════════════════════════════ */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* ══════════════════════════════════════════════════
          Layer 3 — War-Room Coordinate Grid
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          backgroundImage: [
            'repeating-linear-gradient(0deg, rgba(255,106,0,0.05) 0px, rgba(255,106,0,0.05) 1px, transparent 1px, transparent 120px)',
            'repeating-linear-gradient(90deg, rgba(255,106,0,0.05) 0px, rgba(255,106,0,0.05) 1px, transparent 1px, transparent 120px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />

      {/* ══════════════════════════════════════════════════
          Layer 4 — Radar Ping Animations (5 threat zones)
          ══════════════════════════════════════════════════ */}
      {RADAR_PINGS.map((p, i) => (
        <div
          key={`ping-${i}`}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          {/* Center dot */}
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'rgba(255,106,0,0.25)',
              position: 'absolute',
              top: -2,
              left: -2,
            }}
          />
          {/* 3 concentric expanding rings */}
          {[0, 1, 2].map((r) => (
            <div
              key={r}
              style={{
                position: 'absolute',
                width: 100,
                height: 100,
                top: -50,
                left: -50,
                borderRadius: '50%',
                border: '1px solid rgba(255,106,0,0.1)',
                animation: `tm-radarPing ${p.duration}s ease-out infinite`,
                animationDelay: `${r * (p.duration / 3)}s`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      ))}

      {/* ══════════════════════════════════════════════════
          Layer 4 — Connection Lines Between Radar Nodes
          ══════════════════════════════════════════════════ */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      >
        {CONNECTIONS.map(([from, to], i) => (
          <line
            key={`conn-${i}`}
            x1={`${RADAR_PINGS[from].x}%`}
            y1={`${RADAR_PINGS[from].y}%`}
            x2={`${RADAR_PINGS[to].x}%`}
            y2={`${RADAR_PINGS[to].y}%`}
            stroke="rgba(255,106,0,0.06)"
            strokeWidth="1"
            strokeDasharray="8 6"
            style={{
              animation: 'tm-dashFlow 3s linear infinite',
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </svg>

      {/* ══════════════════════════════════════════════════
          Layer 5 — Ambient Flash Overlay (dramatic star trigger)
          ══════════════════════════════════════════════════ */}
      <div
        ref={flashRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background: 'transparent',
          willChange: 'background',
        }}
      />

      {/* ══════════════════════════════════════════════════
          Layer 10 — Login Card (centered glassmorphic panel)
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          className="tm-login-card"
          style={{
            width: 420,
            maxWidth: '100%',
            padding: 45,
            background: 'rgba(15,12,30,0.65)',
            backdropFilter: 'blur(25px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(25px) saturate(1.3)',
            borderTop: '1px solid rgba(255,106,0,0.3)',
            borderRight: '1px solid rgba(255,106,0,0.15)',
            borderBottom: '1px solid rgba(255,106,0,0.1)',
            borderLeft: '1px solid rgba(255,106,0,0.15)',
            borderRadius: 20,
            boxShadow:
              '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,106,0,0.06)',
            animation: 'tm-cardEntry 0.8s ease-out both',
            willChange: 'transform, opacity',
          }}
        >
          {/* ── Branding ── */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 7,
                color: '#F0F0F0',
                margin: 0,
                textTransform: 'uppercase' as const,
                animation: 'tm-brandGlow 3s ease-in-out infinite',
                fontFamily:
                  "system-ui, -apple-system, 'Segoe UI', sans-serif",
              }}
            >
              THREATMATRIX
            </h1>

            {/* Gradient divider line */}
            <div
              style={{
                width: '60%',
                height: 1,
                margin: '16px auto',
                background:
                  'linear-gradient(to right, transparent, #FF6A00, transparent)',
              }}
            />

            {/* Tagline */}
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                letterSpacing: 3,
                textTransform: 'uppercase' as const,
                margin: 0,
              }}
            >
              THREAT INTELLIGENCE COMMAND CENTER
            </p>
          </div>

          {/* ── Error Banner ── */}
          {apiError && (
            <div
              role="alert"
              aria-live="polite"
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                color: '#ef4444',
                textAlign: 'center',
              }}
            >
              ⚠ {apiError}
            </div>
          )}

          {/* ── Login Form ── */}
          <form onSubmit={handleSubmit} noValidate>
            {/* ── Email / Username ── */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="tm-email"
                style={{
                  display: 'block',
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: 'uppercase' as const,
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 8,
                }}
              >
                Email / Username
              </label>
              <div style={{ position: 'relative' }}>
                {/* User icon */}
                <svg
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,106,0,0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="tm-email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  disabled={authState === 'authenticating'}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setApiError(null);
                  }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  aria-required="true"
                  placeholder="operator@threatmatrix.io"
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 48px',
                    background: emailFocus
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${emailFocus ? 'rgba(255,106,0,0.5)' : 'rgba(255,106,0,0.12)'}`,
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 15,
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxShadow: emailFocus
                      ? '0 0 15px rgba(255,106,0,0.1)'
                      : 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* ── Password ── */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="tm-password"
                style={{
                  display: 'block',
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: 'uppercase' as const,
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                {/* Lock icon */}
                <svg
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,106,0,0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="tm-password"
                  type="password"
                  autoComplete="current-password"
                  disabled={authState === 'authenticating'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setApiError(null);
                  }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  aria-required="true"
                  placeholder="••••••••••"
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 48px',
                    background: passFocus
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${passFocus ? 'rgba(255,106,0,0.5)' : 'rgba(255,106,0,0.12)'}`,
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 15,
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxShadow: passFocus
                      ? '0 0 15px rgba(255,106,0,0.1)'
                      : 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* ── Remember Me + Forgot Password Row ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              {/* Custom styled checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `1px solid ${remember ? '#FF6A00' : 'rgba(255,106,0,0.2)'}`,
                    background: remember
                      ? 'rgba(255,106,0,0.15)'
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {remember && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF6A00"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  style={{ display: 'none' }}
                  aria-label="Remember this device"
                />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 12,
                  }}
                >
                  Remember me
                </span>
              </label>

              {/* Forgot password link */}
              <a
                href="/forgot-password"
                onMouseEnter={() => setForgotHover(true)}
                onMouseLeave={() => setForgotHover(false)}
                style={{
                  color: forgotHover
                    ? '#FF6A00'
                    : 'rgba(255,255,255,0.35)',
                  fontSize: 12,
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                  cursor: 'pointer',
                }}
              >
                Forgot Password?
              </a>
            </div>

            {/* ── Submit Button ── */}
            <button
              type="submit"
              disabled={!canSubmit}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => {
                setBtnHover(false);
                setBtnActive(false);
              }}
              onMouseDown={() => setBtnActive(true)}
              onMouseUp={() => setBtnActive(false)}
              aria-busy={authState === 'authenticating'}
              style={{
                width: '100%',
                padding: 16,
                border: 'none',
                borderRadius: 12,
                background:
                  authState === 'success'
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : canSubmit
                      ? btnHover
                        ? 'linear-gradient(135deg, #FF7A10, #FF9C10)'
                        : 'linear-gradient(135deg, #FF6A00, #FF8C00)'
                      : 'linear-gradient(135deg, rgba(255,106,0,0.3), rgba(255,140,0,0.3))',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase' as const,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                position: 'relative',
                overflow: 'hidden',
                boxShadow:
                  btnHover && canSubmit
                    ? '0 6px 30px rgba(255,106,0,0.5)'
                    : '0 4px 20px rgba(255,106,0,0.35)',
                transform: btnActive
                  ? 'translateY(1px)'
                  : btnHover && canSubmit
                    ? 'translateY(-1px)'
                    : 'none',
                transition: 'all 0.3s',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontFamily: 'inherit',
                opacity: canSubmit ? 1 : 0.6,
              }}
            >
              {/* Shimmer sweep overlay */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  animation: canSubmit
                    ? 'tm-shimmer 4s ease-in-out infinite'
                    : 'none',
                  pointerEvents: 'none',
                  willChange: 'transform',
                }}
              />

              {/* Button label */}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {authState === 'authenticating' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'tm-spinnerRotate 0.8s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    Authenticating...
                  </span>
                ) : authState === 'success' ? (
                  '✓ Access Granted'
                ) : (
                  'Access Command Center'
                )}
              </span>
            </button>
          </form>

          {/* ── Footer ── */}
          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              marginBottom: 0,
              color: 'rgba(255,255,255,0.25)',
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            ThreatMatrix v0.1.0 — Secure Auth Gateway
          </p>
        </div>
      </div>
    </div>
  );
}
