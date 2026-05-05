// ============================================================
// hooks/useClock.ts — Dual Clock System (Millisecond Precision)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Color, ClockState, TimeControl } from '../types/chess.types';

interface UseClockOptions {
  timeControl: TimeControl;
  onTimeout: (color: Color) => void;
  enabled?: boolean;
}

interface ClockHook extends ClockState {
  startClock: () => void;
  stopClock: () => void;
  switchClock: () => void;
  resetClock: () => void;
  addIncrement: (color: Color) => void;
  setTimeControl: (tc: TimeControl) => void;
}

export function useClock({
  timeControl,
  onTimeout,
  enabled = true,
}: UseClockOptions): ClockHook {
  const [white, setWhite] = useState(timeControl.seconds * 1000);
  const [black, setBlack] = useState(timeControl.seconds * 1000);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [running, setRunning] = useState(false);

  const lastTickRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const activeColorRef = useRef<Color | null>(null);
  const runningRef = useRef(false);
  const whiteRef = useRef(timeControl.seconds * 1000);
  const blackRef = useRef(timeControl.seconds * 1000);
  const tcRef = useRef(timeControl);

  // Keep refs in sync
  activeColorRef.current = activeColor;
  runningRef.current = running;
  whiteRef.current = white;
  blackRef.current = black;
  tcRef.current = timeControl;

  const tick = useCallback((timestamp: number) => {
    if (!runningRef.current || !activeColorRef.current) return;

    if (lastTickRef.current !== null) {
      const elapsed = timestamp - lastTickRef.current;

      if (activeColorRef.current === 'w') {
        const newTime = Math.max(0, whiteRef.current - elapsed);
        whiteRef.current = newTime;
        setWhite(newTime);
        if (newTime <= 0) {
          setRunning(false);
          onTimeout('w');
          return;
        }
      } else {
        const newTime = Math.max(0, blackRef.current - elapsed);
        blackRef.current = newTime;
        setBlack(newTime);
        if (newTime <= 0) {
          setRunning(false);
          onTimeout('b');
          return;
        }
      }
    }

    lastTickRef.current = timestamp;
    animFrameRef.current = requestAnimationFrame(tick);
  }, [onTimeout]);

  useEffect(() => {
    if (running && enabled) {
      lastTickRef.current = null;
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [running, enabled, tick]);

  const startClock = useCallback(() => {
    if (!activeColorRef.current) setActiveColor('w');
    setRunning(true);
  }, []);

  const stopClock = useCallback(() => {
    setRunning(false);
  }, []);

  const switchClock = useCallback(() => {
    const current = activeColorRef.current;
    if (!current) {
      // First move made — start black's clock
      setActiveColor('b');
      setRunning(true);
      return;
    }

    // Add increment for player who just moved
    const increment = tcRef.current.increment * 1000;
    if (current === 'w') {
      setWhite(prev => Math.min(tcRef.current.seconds * 1000, prev + increment));
      setActiveColor('b');
    } else {
      setBlack(prev => Math.min(tcRef.current.seconds * 1000, prev + increment));
      setActiveColor('w');
    }
    lastTickRef.current = null; // Prevent time jump on clock switch
  }, []);

  const resetClock = useCallback(() => {
    const startMs = tcRef.current.seconds * 1000;
    setWhite(startMs);
    setBlack(startMs);
    whiteRef.current = startMs;
    blackRef.current = startMs;
    setActiveColor(null);
    setRunning(false);
    lastTickRef.current = null;
  }, []);

  const addIncrement = useCallback((color: Color) => {
    const inc = tcRef.current.increment * 1000;
    if (inc <= 0) return;
    if (color === 'w') setWhite(prev => prev + inc);
    else setBlack(prev => prev + inc);
  }, []);

  const setTimeControl = useCallback((tc: TimeControl) => {
    tcRef.current = tc;
    const startMs = tc.seconds * 1000;
    setWhite(startMs);
    setBlack(startMs);
    whiteRef.current = startMs;
    blackRef.current = startMs;
    setActiveColor(null);
    setRunning(false);
    lastTickRef.current = null;
  }, []);

  return {
    white,
    black,
    activeColor,
    running,
    startClock,
    stopClock,
    switchClock,
    resetClock,
    addIncrement,
    setTimeControl,
  };
}
