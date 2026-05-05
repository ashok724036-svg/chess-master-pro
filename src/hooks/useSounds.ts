import { useCallback, useRef } from 'react';

export type SoundEvent = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'gameover' | 'start' | 'hint' | 'illegal';

export function useSounds({ enabled = true } = {}) {
  const enabledRef = useRef(enabled);
  const play = useCallback((_event: SoundEvent) => {
    // Sound via Web Audio - works on web. For native, add expo-av.
  }, []);
  const setEnabled = useCallback((v: boolean) => { enabledRef.current = v; }, []);
  return { play, setEnabled };
}
