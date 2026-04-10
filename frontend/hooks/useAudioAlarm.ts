'use client';

import { useCallback, useRef, useEffect } from 'react';

type AlarmType = 'critical' | 'high' | 'medium' | 'low';

export function useAudioAlarm() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef<boolean>(false);

  // Initialize AudioContext on first interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      isEnabledRef.current = true;
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  const playAlarm = useCallback((type: AlarmType) => {
    if (!audioCtxRef.current || !isEnabledRef.current) return;

    const ctx = audioCtxRef.current;
    
    if (type === 'critical') {
      // Siren sound: Oscillating frequency
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      
    } else if (type === 'high') {
      // High beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
    // Medium and Low are silent by design
  }, []);

  return { playAlarm };
}
