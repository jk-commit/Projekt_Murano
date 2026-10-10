import type { Tour } from "../tours";
import { useToast } from "../hooks/useToast";
import { useTourEngine } from "../hooks/useTourEngine";
import { TourTopBar } from "./TourTopBar";
import { TourMap } from "./TourMap";
import { Toast } from "./Toast";
import { AudioDrawer } from "./AudioDrawer";
import { NextStopButton } from "./NextStopButton";
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
  const { state: audioState, togglePause, skipCurrent, replayCurrent } = engine.audio;
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
        <TourMap tour={tour} userPosition={engine.userPosition} />
      </div>

      <AudioDrawer
        state={audioState}
        onTogglePause={togglePause}
        onSkip={skipCurrent}
        onReplay={replayCurrent}
        hint={engine.walkHint}
      />

      {engine.nextStop && (
        <NextStopButton label={engine.nextStop.name} raised={drawerVisible} onClick={engine.next} />
      )}

      {tour.guide.askEnabled && (
        <AskGuide
          tourId={tour.id}
          guideName={tour.guide.name}
          placeName={engine.currentPlaceName}
          drawerVisible={drawerVisible}
          isAudioPlaying={audioState.isPlaying}
          onToggleAudio={togglePause}
          onToast={showToast}
        />
      )}

      {engine.tourComplete && <TourCompleteOverlay tour={tour} onBackToHome={onBackToHome} />}
    </div>
  );
}
