'use client';

import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

interface AudioManagerContextValue {
  activePlayerId: string | null;
  requestPlay: (playerId: string, audio: HTMLAudioElement) => void;
  requestPause: (playerId: string) => void;
}

const AudioManagerContext = createContext<AudioManagerContextValue>({
  activePlayerId: null,
  requestPlay: () => {},
  requestPause: () => {},
});

export function useAudioManager() {
  return useContext(AudioManagerContext);
}

export default function AudioManagerProvider({ children }: { children: React.ReactNode }) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayerIdRef = useRef<string | null>(null);

  const requestPlay = useCallback((playerId: string, audio: HTMLAudioElement) => {
    if (currentAudioRef.current && currentAudioRef.current !== audio) {
      currentAudioRef.current.pause();
    }

    currentAudioRef.current = audio;
    currentPlayerIdRef.current = playerId;
    setActivePlayerId(playerId);

    audio.play().catch(() => {});
  }, []);

  const requestPause = useCallback((playerId: string) => {
    if (currentPlayerIdRef.current === playerId && currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (currentPlayerIdRef.current === playerId) {
      currentAudioRef.current = null;
      currentPlayerIdRef.current = null;
      setActivePlayerId(null);
    }
  }, []);

  return (
    <AudioManagerContext.Provider value={{ activePlayerId, requestPlay, requestPause }}>
      {children}
    </AudioManagerContext.Provider>
  );
}
