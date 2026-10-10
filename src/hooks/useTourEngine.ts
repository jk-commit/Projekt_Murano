import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { poiStops, type LatLng, type Stop, type Tour } from "../tours";
import { useAudioPlayer } from "./useAudioPlayer";

/**
 * Runs a tour: plays the intro, advances through the stops on "Next Stop",
 * fires timer-triggered stops, and detects when the tour is complete.
 */
export function useTourEngine(tour: Tour, showToast: (msg: string) => void) {
  const audio = useAudioPlayer();
  const { state: audioState, playSequence, skipCurrent } = audio;

  // -1 = intro playing, otherwise index into tour.stops
  const [currentStep, setCurrentStep] = useState(-1);
  const [userPosition, setUserPosition] = useState<LatLng>(tour.center);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [tourComplete, setTourComplete] = useState(false);

  const triggeredRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const pois = useMemo(() => poiStops(tour), [tour]);
  const lastPoiId = pois[pois.length - 1]?.id;
  const audioIdle = !audioState.isPlaying && audioState.totalTracks === 0;

  const stopIndex = useCallback((id: string) => tour.stops.findIndex((s) => s.id === id), [tour]);

  const triggerStop = useCallback(
    (stop: Stop) => {
      if (triggeredRef.current.has(stop.id)) return;
      triggeredRef.current.add(stop.id);

      // Reaching a stop cancels pending timers for stops we have already passed.
      const index = stopIndex(stop.id);
      timersRef.current.forEach((timer, id) => {
        if (stopIndex(id) < index) {
          clearTimeout(timer);
          timersRef.current.delete(id);
        }
      });

      playSequence(stop.audio, stop.name);
      setActiveStopId(stop.id);
      if (stop.type === "poi") setCompletedCount((n) => n + 1);
    },
    [playSequence, stopIndex],
  );

  // Play the intro on start; stop all audio and timers when leaving the tour.
  useEffect(() => {
    const timers = timersRef.current;
    playSequence(tour.intro.audio, tour.intro.label);
    return () => {
      skipCurrent();
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [tour, playSequence, skipCurrent]);

  // Timer-triggered stops start counting once the stop they follow has finished playing.
  useEffect(() => {
    if (!audioIdle || !activeStopId) return;
    for (const stop of tour.stops) {
      if (
        stop.trigger?.afterStopId === activeStopId &&
        !triggeredRef.current.has(stop.id) &&
        !timersRef.current.has(stop.id)
      ) {
        const timer = setTimeout(() => {
          timersRef.current.delete(stop.id);
          triggerStop(stop);
        }, stop.trigger.delaySeconds * 1000);
        timersRef.current.set(stop.id, timer);
      }
    }
  }, [audioIdle, activeStopId, tour, triggerStop]);

  useEffect(() => {
    if (lastPoiId && triggeredRef.current.has(lastPoiId) && audioIdle) setTourComplete(true);
  }, [completedCount, audioIdle, lastPoiId]);

  const next = useCallback(() => {
    const nextIndex = currentStep + 1;
    const stop = tour.stops[nextIndex];
    if (!stop) return;

    setCurrentStep(nextIndex);
    if (stop.position) setUserPosition(stop.position);
    // Timer-triggered stops are only stepped over here; their timer plays the audio.
    if (!stop.trigger) triggerStop(stop);

    const ahead = tour.stops[nextIndex + 1];
    if (ahead?.type === "poi") showToast(`You're getting close to ${ahead.name}`);
  }, [currentStep, tour, triggerStop, showToast]);

  const nextStop = tour.stops[currentStep + 1] ?? null;
  const activeStop = tour.stops.find((s) => s.id === activeStopId);
  const walkHint = audioState.totalTracks > 0 ? activeStop?.walkHint : undefined;

  // The place the user is at or walking to — the context for questions to the guide.
  const currentPlaceName = useMemo(() => {
    const current = tour.stops[currentStep];
    if (current?.type === "poi") return current.name;
    const upcoming = tour.stops.slice(currentStep + 1).find((s) => s.type === "poi");
    return upcoming?.name ?? pois[pois.length - 1]?.name ?? tour.shortTitle;
  }, [tour, currentStep, pois]);

  return {
    audio,
    currentStep,
    nextStop,
    userPosition,
    completedCount,
    totalPOIs: pois.length,
    tourComplete,
    walkHint,
    currentPlaceName,
    next,
  };
}
