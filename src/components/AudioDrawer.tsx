import { Pause, Play, ChevronUp, MapPin, RotateCcw, RotateCw } from "lucide-react";
import { AudioPlayerState, PLAYBACK_RATES, SEEK_SECONDS } from "../hooks/useAudioPlayer";
import { ORANGE, ORANGE_TINT } from "../theme";

interface AudioDrawerProps {
  state: AudioPlayerState;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onTogglePause: () => void;
  /** Moves within the current track, in seconds (negative = back). */
  onSeek: (seconds: number) => void;
  /** Extra line under the track info, e.g. the walking time to the next stop. */
  hint?: string;
}

function SeekButton({ direction, onSeek }: { direction: "back" | "forward"; onSeek: (seconds: number) => void }) {
  const isBack = direction === "back";
  const Icon = isBack ? RotateCcw : RotateCw;

  return (
    <button
      onClick={() => onSeek(isBack ? -SEEK_SECONDS : SEEK_SECONDS)}
      className="relative w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90"
      aria-label={`${isBack ? "Back" : "Forward"} ${SEEK_SECONDS} seconds`}
    >
      <Icon className="w-8 h-8" strokeWidth={1.5} />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" aria-hidden="true">
        {SEEK_SECONDS}
      </span>
    </button>
  );
}

export function AudioDrawer({
  state,
  playbackRate,
  onPlaybackRateChange,
  onTogglePause,
  onSeek,
  hint,
}: AudioDrawerProps) {
  const { isPlaying, currentTrackIndex, totalTracks, progress, label } = state;

  if (!isPlaying && totalTracks === 0) return null;

  // Each tap moves to the next preset speed, wrapping from the fastest back to the slowest.
  const nextRate = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(playbackRate) + 1) % PLAYBACK_RATES.length];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-out ${
        isPlaying || totalTracks > 0 ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.10)] border-t border-gray-100 px-5 pt-3 pb-6 safe-area-bottom">
        <div className="flex justify-center mb-3">
          <ChevronUp className="w-5 h-5 text-gray-300" />
        </div>

        {/* Label row */}
        <div className="flex items-start gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: ORANGE_TINT }}
          >
            <MapPin className="w-4 h-4" style={{ color: ORANGE }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{label}</h3>
            <p className="text-xs text-gray-400">
              Track {currentTrackIndex + 1} of {totalTracks}
            </p>
            {hint && (
              <p className="text-xs font-medium mt-0.5" style={{ color: ORANGE }}>
                {hint}
              </p>
            )}
          </div>
          <button
            onClick={() => onPlaybackRateChange(nextRate)}
            className="flex-shrink-0 min-w-[3.25rem] h-9 px-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-semibold tabular-nums transition-all active:scale-90"
            style={playbackRate === 1 ? { color: "#4b5563" } : { color: ORANGE, backgroundColor: ORANGE_TINT }}
            aria-label={`Playback speed ${playbackRate}×, tap for ${nextRate}×`}
          >
            {playbackRate}×
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-4 mb-4">
          <SeekButton direction="back" onSeek={onSeek} />

          <button
            onClick={onTogglePause}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 hover:opacity-90"
            style={{ backgroundColor: ORANGE }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <SeekButton direction="forward" onSeek={onSeek} />
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-linear"
            style={{ width: `${progress * 100}%`, backgroundColor: ORANGE }}
          />
        </div>
      </div>
    </div>
  );
}
