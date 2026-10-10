import { useState, useRef, useEffect } from "react";
import { Headphones, Play, Pause, Globe, ArrowLeft } from "lucide-react";
import { poiStops, type Tour } from "../tours";
import { ORANGE } from "../theme";

interface TourStartScreenProps {
  tour: Tour;
  onStart: () => void;
  onBack: () => void;
}

export function TourStartScreen({ tour, onStart, onBack }: TourStartScreenProps) {
  const pois = poiStops(tour);
  const [guideRevealed, setGuideRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(tour.guide.introAudio);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(1);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [tour.guide.introAudio]);

  const handleMeetGuide = () => {
    setGuideRevealed(true);
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center px-4 h-14 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <span className="ml-2 text-base font-bold text-gray-900 tracking-tight">{tour.title}</span>
      </div>

      <div className="flex flex-col flex-1 px-6 pt-8 pb-8 max-w-md mx-auto w-full">
        {/* Hero image strip */}
        <div className="rounded-2xl overflow-hidden h-40 mb-6 relative">
          <img src={tour.heroImage} alt={tour.shortTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <span className="text-xs font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {tour.region}
            </span>
          </div>
          {tour.heroCredit && (
            <div className="absolute bottom-3 right-4">
              <span className="text-[10px] text-white/60">{tour.heroCredit}</span>
            </div>
          )}
        </div>

        {/* Title + meta */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{tour.shortTitle}</h1>
        <p className="text-gray-500 mb-4 text-sm leading-relaxed">
          {tour.description}
        </p>

        {/* Tour summary row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-gray-400">
            <Headphones className="w-4 h-4" />
            <span className="text-sm">
              {pois.length} stops &middot; {tour.duration} &middot; GPS-guided
            </span>
          </div>
          {/* Language pill */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 cursor-default select-none"
            tabIndex={-1}
          >
            <Globe className="w-3 h-3" />
            {tour.language.flag} {tour.language.label}
          </button>
        </div>

        {/* Stops list */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Highlights</p>
          <div className="space-y-2">
            {pois.map((stop, i) => (
              <div key={stop.id} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: ORANGE }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700">{stop.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom sticky area */}
        <div className="mt-auto space-y-4">
          {/* Guide audio player — revealed on tap */}
          {guideRevealed ? (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                Meet your tour guide
              </p>
              <p className="text-sm text-gray-600 mb-5">{tour.guide.name} · Tour Guide Introduction</p>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 hover:opacity-90 text-white"
                  style={{ backgroundColor: ORANGE }}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </button>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 ease-linear"
                    style={{ width: `${progress * 100}%`, backgroundColor: ORANGE }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleMeetGuide}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: ORANGE }}
            >
              <Headphones className="w-5 h-5" />
              Meet {tour.guide.name}
            </button>
          )}

          {/* Start Tour — always visible once guide is revealed, or always show */}
          <button
            onClick={onStart}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-95 ${
              guideRevealed
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Start Tour
          </button>

          <p className="text-xs text-gray-400 text-center">
            Allow location access when prompted so the tour can guide you to each stop.
          </p>
        </div>
      </div>
    </div>
  );
}
