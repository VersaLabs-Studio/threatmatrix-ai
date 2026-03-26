# Cinematic About Page — Grade-A Implementation Plan

## Context

ThreatMatrix AI — `frontend/` is a Next.js 16 app (React 19). The root layout wraps every page in `AppShell` (Sidebar + TopBar + StatusBar). The `/about` route needs a **standalone cinematic layout** that bypasses AppShell entirely.

The About Experience lives in **`packages/about-experience`** — a dedicated monorepo package _outside_ the `frontend/` app directory — consumed by Next.js via a path alias (`@about-experience/*`). This keeps the cinematic engine fully decoupled and independently testable.

Framer-motion is **not yet installed**. We'll add it as a dependency.

Since real Veo/AI-generated video assets do not exist yet, the code stubs them with **poster-image fallbacks** that upgrade automatically when MP4s are dropped in `frontend/public/videos/about/`.

---

## File Structure

```
threatmatrix-ai/                          ← monorepo root
├── backend/
├── frontend/                             ← existing Next.js 16 app
│   ├── app/
│   │   ├── about/
│   │   │   ├── layout.tsx                [NEW] standalone layout (no AppShell)
│   │   │   ├── page.tsx                  [NEW] orchestrates all sections
│   │   │   └── about.css                 [NEW] cinematic CSS (Sentinel overlay, scroll styles)
│   │   └── ... (existing routes unchanged)
│   ├── next.config.ts                    [MODIFY] add path alias @about-experience
│   ├── tsconfig.json                     [MODIFY] add paths entry
│   └── public/
│       └── videos/
│           └── about/                    [NEW] video + poster assets directory
│               ├── README.md
│               ├── hero.mp4              ← drop your Veo clips here
│               ├── problem.mp4
│               ├── architecture.mp4
│               ├── ml-models.mp4
│               ├── competitive.mp4
│               ├── tech-stack.mp4
│               ├── cta-portal.mp4
│               ├── poster-hero.webp
│               └── ... (poster frames)
│
└── packages/                             ← NEW monorepo packages dir
    └── about-experience/                 ← NEW standalone package
        ├── package.json                  (name: "@about-experience")
        ├── tsconfig.json                 (extends root tsconfig)
        ├── index.ts                      (barrel export)
        │
        ├── engine/                       ← core scroll/video engine
        │   ├── ScrollytellingProvider.tsx  context + global scroll state
        │   ├── VideoScrollEngine.tsx       spring-damped scroll→video hook
        │   └── CinematicVideoSection.tsx   lazy-load + IntersectionObserver shell
        │
        ├── components/                   ← reusable building blocks
        │   ├── Preloader.tsx               full-screen video preloader
        │   ├── ScrollProgress.tsx          fixed right-side dot navigation
        │   ├── AnimatedCounter.tsx         count-up on viewport entry
        │   └── GlassCard.tsx               glassmorphism card primitive
        │
        └── sections/                     ← 8 content sections
            ├── HeroSection.tsx
            ├── ProblemSection.tsx
            ├── ArchitectureSection.tsx
            ├── MLSection.tsx
            ├── CompetitiveSection.tsx
            ├── TechStackSection.tsx
            ├── BenchmarksSection.tsx     (no video — CSS particle bg)
            └── CTASection.tsx
```

---

## Key Decisions

> **Standalone Layout**: The `/about` page completely bypasses `AppShell` (no sidebar, topbar, or status bar). All other app routes remain unaffected.

> **Video Assets**: Real Veo-generated MP4 clips are not included yet — code stubs with poster image fallbacks. Drop your generated MP4s into `frontend/public/videos/about/` and they will work automatically.

> **framer-motion**: New npm dependency. Run `pnpm add framer-motion` in `frontend/` and `packages/about-experience/`.

> **Monorepo wiring**: `packages/about-experience` must be linked to `frontend/` via `pnpm-workspace.yaml` and a `tsconfig.json` path alias.

---

## Proposed Changes

### Monorepo Wiring

#### [MODIFY] `frontend/pnpm-workspace.yaml`
Add `- '../../packages/*'` so pnpm recognises the monorepo package.

#### [NEW] `packages/about-experience/package.json`
```json
{
  "name": "@about-experience",
  "version": "0.1.0",
  "private": true,
  "main": "./index.ts"
}
```

#### [MODIFY] `frontend/tsconfig.json`
Add path alias:
```json
"paths": { "@about-experience/*": ["../../packages/about-experience/*"] }
```

#### [MODIFY] `frontend/next.config.ts`
Add `transpilePackages: ['@about-experience']` so Next.js compiles the external package.

---

### Dependencies

#### [MODIFY] `frontend/package.json`
Add `framer-motion` (^11.x).

---

### Standalone Layout

#### [NEW] `frontend/app/about/layout.tsx`
Overrides root layout. Renders `<html><body>` with **no** AppShell — purely the children + cinematic CSS. Includes SEO metadata export.

---

### Styles

#### [NEW] `frontend/app/about/about.css`
Cinematic design system for the about page:
- CSS variables (pure-black palette, extends existing `globals.css` tokens)
- `.sentinel-overlay` — scanlines (`repeating-linear-gradient`), vignette (`radial-gradient`), film grain (SVG `feTurbulence` pseudo-element)
- `.video-section` + `.video-wrapper` + `.bg-video` — parallax video container
- `.about-glass-card` — glassmorphism with `backdrop-filter` + `border-image` gradient
- `.scroll-dot` / `.scroll-dot--active` — fixed right-side nav dots
- `@keyframes kenburns`, `@keyframes grain-shift`, `@keyframes count-up`, `@keyframes fade-slide-in`
- `@media (prefers-reduced-motion)` — disables all animations
- `@media (max-width: 768px)` — mobile responsive

---

### Core Engine

#### [NEW] `packages/about-experience/engine/ScrollytellingProvider.tsx`
React Context providing:
```ts
interface ScrollytellingState {
  currentSection: number;      // 0-7 active section index
  sectionProgress: number;     // 0-1 progress within current section
  globalProgress: number;      // 0-1 entire page progress
  direction: 'up' | 'down';
  setActiveSection: (i: number) => void;
}
```
Uses `useScroll` + `useSpring` from framer-motion for spring-damped smoothness. Broadcasts to all child sections via Context.

#### [NEW] `packages/about-experience/engine/VideoScrollEngine.tsx`
Hook `useVideoScrub(videoRef, sectionRef)`:
- `useScroll({ target: sectionRef, offset: ["start end", "end start"] })`
- `scrollYProgress.on("change", v => video.currentTime = v * duration)` — scroll → playhead
- Spring damping: `stiffness: 80, damping: 25`
- `IntersectionObserver`: plays when >40% visible, pauses off-screen
- Returns `{ scrollYProgress, videoY, opacity }` motion values

#### [NEW] `packages/about-experience/engine/CinematicVideoSection.tsx`
Main reusable section shell:
- Props: `videoSrc`, `posterSrc`, `sectionIndex`, `children`, `className?`
- Adaptive bitrate: checks `navigator.connection.effectiveType` — on `'2g'`/`'slow-2g'`, shows poster only
- `preload="metadata"` default; upgrades to `preload="auto"` on IntersectionObserver nearEntry (rootMargin: 200px)
- Calls `setActiveSection(sectionIndex)` from context

#### [NEW] `packages/about-experience/components/Preloader.tsx`
- ThreatMatrix hexagon SVG logo + `"INITIALIZING COMMAND INTELLIGENCE..."` text
- Progress bar via `Promise.all(fetch(src, { method: 'HEAD' }))` for all 7 videos
- 2.5s timeout fallback if assets absent (offline / no video yet)
- Cinematic fade + scale-up exit transition
- `prefers-reduced-motion`: skips immediately

#### [NEW] `packages/about-experience/components/ScrollProgress.tsx`
- 8 fixed right-side dots; active = cyan glow + scale-1.5
- Click scrolls to section via `scrollIntoView`; hover shows label tooltip

#### [NEW] `packages/about-experience/components/AnimatedCounter.tsx`
`requestAnimationFrame` easing counter 0 → target on IntersectionObserver entry.

#### [NEW] `packages/about-experience/components/GlassCard.tsx`
Glassmorphism card primitive. Prop: `accent?: 'cyan' | 'orange' | 'purple'`.

---

### Section Components (8 sections)

All live in `packages/about-experience/sections/` and use `CinematicVideoSection` as their outer shell.

| File | Video | Key Interactive |
|------|-------|-----------------|
| `HeroSection.tsx` | V1 Hero | Ken Burns zoom, bouncing scroll arrow |
| `ProblemSection.tsx` | V2 Globe | 3× `AnimatedCounter` stat cards |
| `ArchitectureSection.tsx` | V3 3 Layers | Staggered tier card reveal |
| `MLSection.tsx` | V4 Neural | Model cards + animated ensemble formula |
| `CompetitiveSection.tsx` | V5 Comparison | CSS-fill animated progress bars |
| `TechStackSection.tsx` | V6 Tech Orbit | Hover-glow icon grid |
| `BenchmarksSection.tsx` | None | CSS-particle bg + 6× `AnimatedCounter` |
| `CTASection.tsx` | V7 Portal | Pulsing CTA → `/login` |

---

### Main Page

#### [NEW] `frontend/app/about/page.tsx`
Imports all sections from `@about-experience/sections/*`. Assembles inside `ScrollytellingProvider`. Renders `<Preloader>` + `<ScrollProgress>` as fixed overlays. Sections rendered in order.

---

### Public Asset Stubs

#### [NEW] `frontend/public/videos/about/README.md`
Documents expected MP4 filenames and poster frame names. Includes Veo prompt cheatsheet for quick generation.

---

## Verification Plan

### Automated
```bash
# TypeScript compile check
cd frontend && npx tsc --noEmit
```

### Browser Verification
```
1. pnpm dev → navigate to http://localhost:3000/about
2. Confirm: Preloader shows on load → fades out cleanly
3. Confirm: No sidebar/topbar visible
4. Scroll through all 8 sections — verify content overlays appear
5. Confirm: ScrollProgress dots on right are active/clickable
6. DevTools → Network → throttle to "Slow 3G" → reload → confirm poster shown instead of video
7. DevTools → Emulate prefers-reduced-motion: reduce → confirm no animations run
8. DevTools → Responsive → 375px → confirm mobile layout
```

### Manual
- Navigate to `/login` — confirm sidebar/topbar still present (unaffected routes)
- Drop a real MP4 into `public/videos/about/hero.mp4` — confirm video scrubbing on scroll
