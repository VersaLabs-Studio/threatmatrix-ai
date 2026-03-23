'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Sentinel3D
// Three.js 3D hexagonal sentinel with particle system
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Sentinel3DProps {
  state: 'idle' | 'authenticating' | 'success' | 'error';
  progress?: number; // 0-100 during authentication
}

// State colors
const STATE_COLORS = {
  idle: new THREE.Color(0x00f0ff),      // Cyan
  authenticating: new THREE.Color(0x8b5cf6), // Purple
  success: new THREE.Color(0x22c55e),   // Green
  error: new THREE.Color(0xef4444),     // Red
};

// Hexagon vertices (inscribed in circle of radius 1)
function createHexagonVertices(): Float32Array {
  const vertices: number[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6 - Math.PI / 2; // Start at top
    vertices.push(Math.cos(angle), Math.sin(angle), 0);
    // Add inner vertex for double-ring effect
    vertices.push(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0);
  }
  // Close the loop
  vertices.push(...vertices.slice(0, 3));
  return new Float32Array(vertices);
}

// Create particle system
function createParticles(count: number): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Distribute particles on a sphere-like volume
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 1.2 + Math.random() * 0.8;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Random velocities
    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

    sizes[i] = Math.random() * 3 + 1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: STATE_COLORS.idle,
    size: 0.03,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.userData = { velocities } as any;

  return points;
}

// Create connection lines between hexagon vertices
function createHexagonLines(): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];

  // Outer hexagon
  for (let i = 0; i < 6; i++) {
    const angle1 = (i * Math.PI * 2) / 6 - Math.PI / 2;
    const angle2 = ((i + 1) % 6 * Math.PI * 2) / 6 - Math.PI / 2;
    vertices.push(
      Math.cos(angle1), Math.sin(angle1), 0,
      Math.cos(angle2), Math.sin(angle2), 0
    );
  }

  // Inner hexagon (smaller)
  for (let i = 0; i < 6; i++) {
    const angle1 = (i * Math.PI * 2) / 6 - Math.PI / 2;
    const angle2 = ((i + 1) % 6 * Math.PI * 2) / 6 - Math.PI / 2;
    vertices.push(
      Math.cos(angle1) * 0.7, Math.sin(angle1) * 0.7, 0,
      Math.cos(angle2) * 0.7, Math.sin(angle2) * 0.7, 0
    );
  }

  // Radial lines connecting outer to inner
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
    vertices.push(
      Math.cos(angle), Math.sin(angle), 0,
      Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  const material = new THREE.LineBasicMaterial({
    color: STATE_COLORS.idle,
    transparent: true,
    opacity: 0.6,
    linewidth: 1,
  });

  return new THREE.LineSegments(geometry, material);
}

export function Sentinel3D({ state, progress = 0 }: Sentinel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hexagonRef = useRef<THREE.LineSegments | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create hexagon wireframe
    const hexagon = createHexagonLines();
    scene.add(hexagon);
    hexagonRef.current = hexagon;

    // Create particles
    const particles = createParticles(80);
    scene.add(particles);
    particlesRef.current = particles;

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    setIsReady(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      sceneRef.current?.clear();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isReady) return;

    let time = 0;
    let rotationSpeed = 0.005;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.016; // ~60fps

      // Get current refs
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      
      if (!renderer || !scene || !camera) return;

      // Adjust rotation speed based on state
      if (state === 'authenticating') {
        rotationSpeed = 0.03; // Fast
      } else if (state === 'success') {
        rotationSpeed = 0.008; // Moderate
      } else {
        rotationSpeed = 0.005; // Slow idle
      }

      // Rotate hexagon
      if (hexagonRef.current) {
        hexagonRef.current.rotation.y += rotationSpeed;
        hexagonRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      }

      // Rotate and animate particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y -= rotationSpeed * 0.5;
        
        // Pulse effect for success/error
        if (state === 'success' || state === 'error') {
          const scale = 1 + Math.sin(time * 3) * 0.1;
          particlesRef.current.scale.set(scale, scale, scale);
        } else {
          particlesRef.current.scale.set(1, 1, 1);
        }

        // Move particles based on state
        const positions = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const velocities = particlesRef.current.userData.velocities as Float32Array;
        const count = positions.count;

        if (state === 'authenticating') {
          // Converge to center during auth
          for (let i = 0; i < count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            const dist = Math.sqrt(x * x + y * y + z * z);
            
            if (dist > 0.5) {
              positions.setX(i, x * 0.98);
              positions.setY(i, y * 0.98);
              positions.setZ(i, z * 0.98);
            }
          }
        } else if (state === 'error') {
          // Scatter outward
          for (let i = 0; i < count; i++) {
            positions.setX(i, positions.getX(i) + velocities[i * 3] * 2);
            positions.setY(i, positions.getY(i) + velocities[i * 3 + 1] * 2);
            positions.setZ(i, positions.getZ(i) + velocities[i * 3 + 2] * 2);
          }
        } else if (state === 'idle') {
          // Gentle drift
          for (let i = 0; i < count; i++) {
            positions.setX(i, positions.getX(i) + velocities[i * 3]);
            positions.setY(i, positions.getY(i) + velocities[i * 3 + 1]);
            positions.setZ(i, positions.getZ(i) + velocities[i * 3 + 2]);
          }
        }

        positions.needsUpdate = true;
      }

      // Update colors based on state
      const targetColor = STATE_COLORS[state];
      if (hexagonRef.current && hexagonRef.current.material instanceof THREE.LineBasicMaterial) {
        hexagonRef.current.material.color.lerp(targetColor, 0.05);
      }
      if (particlesRef.current && particlesRef.current.material instanceof THREE.PointsMaterial) {
        particlesRef.current.material.color.lerp(targetColor, 0.05);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [isReady, state]);

  // Success animation: form checkmark with particles
  useEffect(() => {
    if (state === 'success' && particlesRef.current) {
      // Particles form expanding ring
      const positions = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const count = positions.count;
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 1.5 + Math.random() * 0.5;
        positions.setX(i, Math.cos(angle) * radius);
        positions.setY(i, Math.sin(angle) * radius);
        positions.setZ(i, (Math.random() - 0.5) * 0.5);
      }
      positions.needsUpdate = true;
    }
  }, [state]);

  return (
    <div
      ref={containerRef}
      className="sentinel-3d"
      style={{
        width: '100%',
        height: '400px',
        position: 'relative',
      }}
      role="img"
      aria-label={`Security sentinel: ${state}`}
    />
  );
}
