'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ThreatMap
// Interactive 3D threat visualization using Deck.gl
// Loaded dynamically (no SSR) — browser-only WebGL
//
// Layers:
//  • ScatterplotLayer — all IPs geo-located
//  • ArcLayer         — attack connections (anomalous flows)
//  • HeatmapLayer     — traffic density
// ═══════════════════════════════════════════════════════

import { useMemo, useState, useEffect, useRef } from 'react';
import { DeckGL } from 'deck.gl';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import type { FlowEvent } from '@/hooks/useWebSocket';

// ── Free dark basemap style from MapTiler Community ───
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ── Seed mock flows for demo (no backend required) ────
interface GeoFlow {
  id: string;
  srcLat: number; srcLon: number;
  dstLat: number; dstLon: number;
  srcIp: string;  dstIp: string;
  isAnomaly: boolean;
  score: number;
}

const SEED_FLOWS: GeoFlow[] = [
  { id: '1', srcLat: 9.025,  srcLon: 38.747,  dstLat: 51.508,  dstLon: -0.128,   srcIp: '10.0.1.5',     dstIp: '104.21.55.12', isAnomaly: true,  score: 0.94 },
  { id: '2', srcLat: 39.904, srcLon: 116.407,  dstLat: 9.025,   dstLon: 38.747,   srcIp: '185.220.101.4', dstIp: '10.0.1.5',    isAnomaly: true,  score: 0.88 },
  { id: '3', srcLat: 37.774, srcLon: -122.419, dstLat: 9.025,   dstLon: 38.747,   srcIp: '45.33.32.156',  dstIp: '10.0.1.12',   isAnomaly: true,  score: 0.81 },
  { id: '4', srcLat: 9.025,  srcLon: 38.747,  dstLat: 8.995,   dstLon: 38.798,   srcIp: '10.0.1.5',     dstIp: '10.0.1.12',   isAnomaly: false, score: 0.12 },
  { id: '5', srcLat: 52.520, srcLon: 13.405,   dstLat: 9.025,   dstLon: 38.747,   srcIp: '91.198.174.1',  dstIp: '10.0.1.5',    isAnomaly: true,  score: 0.76 },
  { id: '6', srcLat: 35.689, srcLon: 139.692,  dstLat: 9.025,   dstLon: 38.747,   srcIp: '203.0.113.42',  dstIp: '10.0.1.8',    isAnomaly: false, score: 0.23 },
  { id: '7', srcLat: 9.025,  srcLon: 38.747,  dstLat: -33.868, dstLon: 151.209,  srcIp: '10.0.1.23',    dstIp: '8.8.8.8',     isAnomaly: true,  score: 0.67 },
  { id: '8', srcLat: 48.856, srcLon: 2.352,    dstLat: 9.025,   dstLon: 38.747,   srcIp: '188.40.123.1',  dstIp: '10.0.1.5',    isAnomaly: false, score: 0.19 },
];

const INITIAL_VIEW_STATE = {
  longitude: 38.747,
  latitude:  9.025,
  zoom:      2.5,
  pitch:     35,
  bearing:   -10,
};

interface ThreatMapProps {
  recentFlows?: FlowEvent[];
  loading?: boolean;
}

export function ThreatMap({ recentFlows = [], loading = false }: ThreatMapProps) {
  const [hovered, setHovered] = useState<GeoFlow | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Wait for container to have valid dimensions before rendering Deck.gl
  useEffect(() => {
    if (!containerRef.current) return;
    
    const checkDimensions = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setIsReady(true);
      }
    };
    
    checkDimensions();
    
    // Poll for a few seconds until dimensions are valid
    const interval = setInterval(checkDimensions, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsReady(true); // Force render even if dimensions not detected
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Merge live flows with seed flows; cap at 200 for performance
  const flows: GeoFlow[] = useMemo(() => {
    const live: GeoFlow[] = recentFlows
      .filter((f) => f.src_lat !== undefined && f.dst_lat !== undefined)
      .slice(-150)
      .map((f) => ({
        id:        f.id,
        srcLat:    f.src_lat!,
        srcLon:    f.src_lon!,
        dstLat:    f.dst_lat!,
        dstLon:    f.dst_lon!,
        srcIp:     f.src_ip,
        dstIp:     f.dst_ip,
        isAnomaly: f.is_anomaly,
        score:     f.anomaly_score,
      }));

    return live.length > 0 ? live : SEED_FLOWS;
  }, [recentFlows]);

  // ── Deck.gl Layers ────────────────────────────────────

  const layers = [
    new HeatmapLayer({
      id:           'heatmap',
      data:         flows,
      getPosition:  (d: GeoFlow) => [d.srcLon, d.srcLat],
      getWeight:    (d: GeoFlow) => d.score * 10,
      radiusPixels: 40,
      opacity:      0.35,
      colorRange: [
        [0,   255, 255, 25],
        [0,   200, 230, 80],
        [255, 150, 0,   150],
        [255, 50,  50,  200],
      ],
    }),

    new ScatterplotLayer({
      id:              'scatter',
      data:            flows,
      getPosition:     (d: GeoFlow) => [d.srcLon, d.srcLat],
      getRadius:       (d: GeoFlow) => d.isAnomaly ? 80000 : 40000,
      getFillColor:    (d: GeoFlow) => d.isAnomaly
        ? [239, 68, 68, 220]
        : [0, 240, 255, 140],
      radiusMinPixels: 3,
      radiusMaxPixels: 14,
      pickable:        true,
      onHover:         (info: { object?: GeoFlow }) => setHovered(info.object ?? null),
      updateTriggers:  { getRadius: flows.length, getFillColor: flows.length },
    }),

    new ArcLayer({
      id:             'arcs',
      data:           flows.filter((f) => f.isAnomaly),
      getSourcePosition: (d: GeoFlow) => [d.srcLon, d.srcLat],
      getTargetPosition: (d: GeoFlow) => [d.dstLon, d.dstLat],
      getSourceColor:  [239, 68, 68, 180],
      getTargetColor:  [249, 115, 22, 220],
      getWidth:        (d: GeoFlow) => Math.max(1, d.score * 4),
      greatCircle:     true,
    }),
  ];

  const anomalyCount = flows.filter(f => f.isAnomaly).length;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {loading ? (
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />
      ) : !isReady ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.75rem', color: '#00f0ff',
          letterSpacing: '0.1em',
        }}>
          INITIALIZING MAP…
        </div>
      ) : (
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={MAP_STYLE} attributionControl={false} />
        </DeckGL>
      )}

      {/* Layer controls */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 10 }}>
        {[
          { label: 'Scatter', color: 'var(--cyan)' },
          { label: 'Arcs',    color: 'var(--critical)' },
          { label: 'Heat',    color: 'var(--warning)' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(10,10,15,0.75)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              color: item.color,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 12, left: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontFamily: 'var(--font-data)',
            fontSize: '0.7rem',
            color: 'var(--text-primary)',
            zIndex: 10,
          }}
        >
          <div style={{ color: hovered.isAnomaly ? 'var(--critical)' : 'var(--cyan)', fontWeight: 700, marginBottom: 4 }}>
            {hovered.isAnomaly ? 'ANOMALOUS FLOW' : 'NORMAL FLOW'}
          </div>
          <div>SRC: {hovered.srcIp}</div>
          <div>DST: {hovered.dstIp}</div>
          <div style={{ color: hovered.isAnomaly ? 'var(--critical)' : 'var(--text-muted)', marginTop: 2 }}>
            Score: {(hovered.score * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Live indicator */}
      <div
        style={{
          position: 'absolute',
          top: 8, left: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(10,10,15,0.75)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 10px',
          fontFamily: 'var(--font-data)',
          fontSize: '0.65rem',
          color: 'var(--cyan)',
          zIndex: 10,
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--cyan)',
          animation: 'pulse 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        {anomalyCount} anomalous · {flows.length} total flows
      </div>
    </div>
  );
}
