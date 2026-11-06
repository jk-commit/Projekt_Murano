import { useState } from "react";
import type { Stop, Tour } from "../tours";
import { useToast } from "../hooks/useToast";
import { useTourEngine } from "../hooks/useTourEngine";
import { useUserLocation } from "../hooks/useUserLocation";
import { TourTopBar } from "./TourTopBar";
import { TourMap } from "./TourMap";
import { Toast } from "./Toast";
import { AudioDrawer } from "./AudioDrawer";
import { StopNavigation } from "./StopNavigation";
import { StopDetailSheet } from "./StopDetailSheet";
import { AskGuide } from "./AskGuide";
import { TourCompleteOverlay } from "./TourCompleteOverlay";

interface TourViewProps {
  tour: Tour;
  onBack: () => void;
  onBackToHome: () => void;
}

export function TourView({ tour, onBack, onBackToHome }: TourViewProps) {
  const { message, showToast } = useToast();
  const engine = useTourEngine(tour, showToast);
  const location = useUserLocation();
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const { state: audioState, playbackRate, setPlaybackRate, togglePause, seekBy } = engine.audio;
  const drawerVisible = audioState.isPlaying || audioState.totalTracks > 0;

  return (
    <div className="fixed inset-0 bg-white">
      <TourTopBar
        title={tour.title}
        completedCount={engine.completedCount}
        totalPOIs={engine.totalPOIs}
        onBack={onBack}
      />

      <Toast message={message} />

      <div className="absolute inset-0 top-14">
        <TourMap
          tour={tour}
          focusPosition={engine.focusPosition}
          currentStopId={engine.currentStopId}
          location={location}
          onStopSelect={setSelectedStop}
          onToast={showToast}
        />
      </div>

      <AudioDrawer
        state={audioState}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        onTogglePause={togglePause}
        onSeek={seekBy}
        hint={engine.walkHint}
      />

      {/* Hidden while the sheet is open, which would otherwise cut it in half. */}
      {!selectedStop && (
        <StopNavigation
          nextLabel={engine.nextStop?.name ?? null}
          previousLabel={engine.previousLabel}
          raised={drawerVisible}
          onNext={engine.next}
          onPrevious={engine.previous}
        />
      )}

      {tour.guide.askEnabled && (
        <AskGuide
          tourId={tour.id}
          language={tour.language.code}
          guideName={tour.guide.name}
          placeName={engine.currentPlaceName}
          drawerVisible={drawerVisible}
          isAudioPlaying={audioState.isPlaying}
          onToggleAudio={togglePause}
          onToast={showToast}
        />
      )}

      {selectedStop && !engine.tourComplete && (
        <StopDetailSheet
          stop={selectedStop}
          isCurrent={selectedStop.id === engine.currentStopId}
          onJump={() => {
            engine.jumpTo(selectedStop.id);
            setSelectedStop(null);
          }}
          onClose={() => setSelectedStop(null)}
        />
      )}

      {engine.tourComplete && <TourCompleteOverlay tour={tour} onBackToHome={onBackToHome} />}
    </div>
  );
}
