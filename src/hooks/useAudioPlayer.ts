import { useCallback, useRef, useState } from "react";

const PAUSE_BETWEEN_TRACKS_MS = 3000;

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  totalTracks: number;
  progress: number;
  label: string;
}

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTrackIndex: 0,
    totalTracks: 0,
    progress: 0,
    label: "",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<string[]>([]);
  const labelRef = useRef("");
  const trackIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const activeRef = useRef(false);

  const clearState = useCallback(() => {
    activeRef.current = false;
    setState({
      isPlaying: false,
      currentTrackIndex: 0,
      totalTracks: 0,
      progress: 0,
      label: "",
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  const playTrackAtIndex = useCallback(
    (index: number) => {
      if (index >= playlistRef.current.length) {
        stopAudio();
        clearState();
        return;
      }

      trackIndexRef.current = index;
      const url = playlistRef.current[index];

      stopAudio();

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          setState((prev) => ({
            ...prev,
            progress: audio.currentTime / audio.duration,
          }));
        }
      });

      audio.addEventListener("ended", () => {
        const nextIndex = index + 1;
        if (nextIndex < playlistRef.current.length) {
          setState((prev) => ({
            ...prev,
            currentTrackIndex: nextIndex,
            progress: 0,
          }));
          setTimeout(() => {
            if (activeRef.current && !isPausedRef.current) {
              playTrackAtIndex(nextIndex);
            }
          }, PAUSE_BETWEEN_TRACKS_MS);
        } else {
          stopAudio();
          clearState();
        }
      });

      audio.play().catch(() => {
        stopAudio();
        clearState();
      });

      setState({
        isPlaying: true,
        currentTrackIndex: index,
        totalTracks: playlistRef.current.length,
        progress: 0,
        label: labelRef.current,
      });
    },
    [stopAudio, clearState],
  );

  const playSequence = useCallback(
    (urls: string[], label: string) => {
      stopAudio();
      playlistRef.current = urls;
      labelRef.current = label;
      isPausedRef.current = false;
      activeRef.current = true;
      playTrackAtIndex(0);
    },
    [playTrackAtIndex, stopAudio],
  );

  const togglePause = useCallback(() => {
    if (!audioRef.current || !activeRef.current) return;

    if (isPausedRef.current) {
      isPausedRef.current = false;
      audioRef.current.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      isPausedRef.current = true;
      audioRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  // Stops current audio immediately and clears the drawer
  const skipCurrent = useCallback(() => {
    stopAudio();
    activeRef.current = false;
    isPausedRef.current = false;
    clearState();
  }, [stopAudio, clearState]);

  // Restarts the current waypoint's audio from track 0
  const replayCurrent = useCallback(() => {
    if (!activeRef.current && playlistRef.current.length === 0) return;
    isPausedRef.current = false;
    activeRef.current = true;
    playTrackAtIndex(0);
  }, [playTrackAtIndex]);

  const isActive = useCallback(() => activeRef.current, []);

  return { state, playSequence, togglePause, skipCurrent, replayCurrent, isActive };
}
