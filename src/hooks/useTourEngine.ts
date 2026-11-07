import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { poiStops, type LatLng, type Stop, type Tour } from "../tours";
import { useAudioPlayer } from "./useAudioPlayer";

/**
 * Runs a tour: plays the intro, moves through the stops on "Next Stop", the back button and
 * map jumps, fires timer-triggered stops, and detects when the tour is complete.
 */
export function useTourEngine(tour: Tour, showToast: (msg: string) => void) {
  const audio = useAudioPlayer(tour.trackGapSeconds === undefined ? undefined : tour.trackGapSeconds * 1000);
  const { state: audioState, playSequence, skipCurrent } = audio;

  // -1 = intro playing, otherwise index into tour.stops
  const [currentStep, setCurrentStep] = useState(-1);
  const [visitedPoiIds, setVisitedPoiIds] = useState<ReadonlySet<string>>(new Set());
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
      if (stop.type === "poi") setVisitedPoiIds((visited) => new Set(visited).add(stop.id));
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
          setCurrentStep((step) => Math.max(step, stopIndex(stop.id)));
          triggerStop(stop);
        }, stop.trigger.delaySeconds * 1000);
        timersRef.current.set(stop.id, timer);
      }
    }
  }, [audioIdle, activeStopId, tour, triggerStop, stopIndex]);

  useEffect(() => {
    if (lastPoiId && activeStopId === lastPoiId && audioIdle) setTourComplete(true);
  }, [activeStopId, audioIdle, lastPoiId]);

  const next = useCallback(() => {
    const nextIndex = currentStep + 1;
    const stop = tour.stops[nextIndex];
    if (!stop) return;

    setCurrentStep(nextIndex);
    // Timer-triggered stops are only stepped over here; their timer plays the audio.
    if (!stop.trigger) triggerStop(stop);

    const ahead = tour.stops[nextIndex + 1];
    if (ahead?.type === "poi") showToast(`You're getting close to ${ahead.name}`);
  }, [currentStep, tour, triggerStop, showToast]);

  /** Moves to any step (-1 = intro) and plays it. Stops after the target can then play again. */
  const goTo = useCallback(
    (index: number) => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
      tour.stops.slice(Math.max(index, 0)).forEach((s) => triggeredRef.current.delete(s.id));

      setCurrentStep(index);
      const stop = tour.stops[index];
      if (stop) {
        triggerStop(stop);
      } else {
        setActiveStopId(null);
        playSequence(tour.intro.audio, tour.intro.label);
      }
    },
    [tour, triggerStop, playSequence],
  );

  // The POI before the current step, else the intro if it has audio; null when there is no way back.
  const previousIndex = useMemo(() => {
    for (let i = currentStep - 1; i >= 0; i--) {
      if (tour.stops[i].type === "poi") return i;
    }
    return currentStep >= 0 && tour.intro.audio.length > 0 ? -1 : null;
  }, [tour, currentStep]);

  const previous = useCallback(() => {
    if (previousIndex === null) return;
    // Going back undoes the step: the POI being left no longer counts as visited.
    const leaving = tour.stops[currentStep];
    if (leaving?.type === "poi") {
      setVisitedPoiIds((visited) => {
        const remaining = new Set(visited);
        remaining.delete(leaving.id);
        return remaining;
      });
    }
    goTo(previousIndex);
  }, [previousIndex, tour, currentStep, goTo]);

  const jumpTo = useCallback(
    (stopId: string) => {
      const index = stopIndex(stopId);
      if (index !== -1 && index !== currentStep) goTo(index);
    },
    [stopIndex, currentStep, goTo],
  );

  const nextStop = tour.stops[currentStep + 1] ?? null;
  const previousLabel = previousIndex === null ? null : (tour.stops[previousIndex]?.name ?? tour.intro.label);
  const activeStop = tour.stops.find((s) => s.id === activeStopId);
  const walkHint = audioState.totalTracks > 0 ? activeStop?.walkHint : undefined;

  // Where the map centers: the latest stop with a position, since not every stop has one.
  const focusPosition = useMemo<LatLng>(() => {
    for (let i = currentStep; i >= 0; i--) {
      const { position } = tour.stops[i];
      if (position) return position;
    }
    return tour.center;
  }, [tour, currentStep]);

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
    currentStopId: tour.stops[currentStep]?.id ?? null,
    nextStop,
    previousLabel,
    focusPosition,
    completedCount: visitedPoiIds.size,
    totalPOIs: pois.length,
    tourComplete,
    walkHint,
    currentPlaceName,
    next,
    previous,
    jumpTo,
  };
}
