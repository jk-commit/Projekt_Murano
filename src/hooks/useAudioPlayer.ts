import { useCallback, useRef, useState } from "react";

const PAUSE_BETWEEN_TRACKS_MS = 3000;

export const PLAYBACK_RATES: readonly number[] = [0.75, 1, 1.25, 1.5, 2];
const PLAYBACK_RATE_KEY = "murano.playbackRate";

// The chosen speed is remembered per browser; storage may be unavailable (private mode).
function loadPlaybackRate(): number {
  try {
    const saved = Number(localStorage.getItem(PLAYBACK_RATE_KEY));
    return PLAYBACK_RATES.includes(saved) ? saved : 1;
  } catch {
    return 1;
  }
}

function savePlaybackRate(rate: number) {
  try {
    localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
  } catch {
    // Not persisted — the speed still applies for this tour.
  }
}

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
  const [playbackRate, setPlaybackRateState] = useState(loadPlaybackRate);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRateRef = useRef(playbackRate);
  const playlistRef = useRef<string[]>([]);
  const labelRef = useRef("");
  const trackIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const activeRef = useRef(false);
  const trackGapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // A pending next track must not start in whatever plays after this.
    if (trackGapTimerRef.current) clearTimeout(trackGapTimerRef.current);
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
      audio.playbackRate = playbackRateRef.current;
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
          trackGapTimerRef.current = setTimeout(() => {
            if (activeRef.current && !isPausedRef.current) {
              playTrackAtIndex(nextIndex);
            }
          }, PAUSE_BETWEEN_TRACKS_MS);
        } else {
          stopAudio();
          clearState();
        }
      });

      audio.play().catch((err) => {
        // Switching stops interrupts a track still starting; that must not stop the new one.
        if (audioRef.current !== audio) return;
        console.error(`Audio playback failed: ${url}`, err);
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

  // Applies to the track playing now and to every following one.
  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
    savePlaybackRate(rate);
  }, []);

  const isActive = useCallback(() => activeRef.current, []);

  return {
    state,
    playbackRate,
    setPlaybackRate,
    playSequence,
    togglePause,
    skipCurrent,
    replayCurrent,
    isActive,
  };
}
