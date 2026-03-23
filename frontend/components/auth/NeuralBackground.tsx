'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — NeuralBackground
// Canvas-based neural network visualization
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';

interface NeuralBackgroundProps {
  state: 'idle' | 'authenticating' | 'success' | 'error';
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAnomaly: boolean;
}

const STATE_CONFIG = {
  idle: {
    nodeColor: 'rgba(0, 240, 255, 0.6)',
    connectionColor: 'rgba(0, 240, 255, 0.15)',
    anomalyColor: 'rgba(239, 68, 68, 0)',
    speed: 0.2,
    connectionDistance: 150,
  },
  authenticating: {
    nodeColor: 'rgba(139, 92, 246, 0.7)',
    connectionColor: 'rgba(139, 92, 246, 0.25)',
    anomalyColor: 'rgba(239, 68, 68, 0)',
    speed: 0.8,
    connectionDistance: 180,
  },
  success: {
    nodeColor: 'rgba(34, 197, 94, 0.7)',
    connectionColor: 'rgba(34, 197, 94, 0.2)',
    anomalyColor: 'rgba(239, 68, 68, 0)',
    speed: 0.4,
    connectionDistance: 160,
  },
  error: {
    nodeColor: 'rgba(0, 240, 255, 0.4)',
    connectionColor: 'rgba(0, 240, 255, 0.1)',
    anomalyColor: 'rgba(239, 68, 68, 0.8)',
    speed: 0.6,
    connectionDistance: 140,
  },
};

export function NeuralBackground({ state }: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Initialize nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create nodes
    const nodeCount = Math.floor((canvas.width * canvas.height) / 15000); // Density based on screen size
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        isAnomaly: state === 'error' && Math.random() < 0.1, // 10% anomalies in error state
      });
    }

    nodesRef.current = nodes;

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = STATE_CONFIG[state];
    const nodes = nodesRef.current;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Update position
        node.x += node.vx * config.speed;
        node.y += node.vy * config.speed;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep within bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.connectionDistance) {
            const opacity = (1 - dist / config.connectionDistance) * 0.3;
            
            // Use anomaly color if either node is anomalous
            const isAnomalyConnection = node.isAnomaly || other.isAnomaly;
            ctx.strokeStyle = isAnomalyConnection 
              ? config.anomalyColor.replace(/[\d.]+\)$/, `${opacity})`)
              : config.connectionColor.replace(/[\d.]+\)$/, `${opacity})`);
            
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw node
        const color = node.isAnomaly ? config.anomalyColor : config.nodeColor;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Pulse effect for anomalies in error state
        if (node.isAnomaly && state === 'error') {
          const pulseRadius = node.radius + Math.sin(timeRef.current * 3) * 2 + 2;
          ctx.strokeStyle = config.anomalyColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Success state: expanding wave from center
      if (state === 'success') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.max(canvas.width, canvas.height);
        const waveRadius = (timeRef.current * 100) % maxRadius;
        
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Authenticating state: converging vortex effect
      if (state === 'authenticating') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw rotating vortex lines
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + timeRef.current * 0.5;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + Math.cos(angle) * canvas.width,
            centerY + Math.sin(angle) * canvas.height
          );
          ctx.stroke();
        }
      }
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="neural-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
