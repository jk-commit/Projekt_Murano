import { useCallback, useRef, useState } from "react";

const DEFAULT_PAUSE_BETWEEN_TRACKS_MS = 3000;

export const PLAYBACK_RATES: readonly number[] = [0.75, 1, 1.25, 1.5, 2];
export const SEEK_SECONDS = 15;
// Forward seeks stop just short of the end so the track finishes by playing, not by seeking:
// a paused track stays paused and "ended" fires the same way in every browser.
const SEEK_END_MARGIN_SECONDS = 0.1;
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

/** `pauseBetweenTracksMs` applies between the tracks of every sequence this player plays. */
export function useAudioPlayer(pauseBetweenTracksMs = DEFAULT_PAUSE_BETWEEN_TRACKS_MS) {
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
          }, pauseBetweenTracksMs);
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
    [stopAudio, clearState, pauseBetweenTracksMs],
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

  // Moves within the current track; seeking does not cross into another track.
  const seekBy = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || audio.readyState < HTMLMediaElement.HAVE_METADATA) return;

    // In the pause between tracks the next one starts by itself, so only going back does anything.
    const inTrackGap = audio.ended;
    if (inTrackGap && seconds > 0) return;

    const lastPosition = Math.max(audio.duration - SEEK_END_MARGIN_SECONDS, 0);
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), lastPosition);

    if (inTrackGap) {
      if (trackGapTimerRef.current) clearTimeout(trackGapTimerRef.current);
      if (!isPausedRef.current) {
        audio.play().catch((err) => console.error("Audio playback failed after seeking", err));
      }
    }
    setState((prev) => ({
      ...prev,
      currentTrackIndex: trackIndexRef.current,
      progress: audio.currentTime / audio.duration,
    }));
  }, []);

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
    seekBy,
    isActive,
  };
}
