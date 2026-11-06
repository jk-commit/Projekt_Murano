import { ChevronLeft } from "lucide-react";
import { ORANGE } from "../theme";

interface StopNavigationProps {
  /** Name of the next stop; no "Next Stop" button when null. */
  nextLabel: string | null;
  /** Name of the previous stop; no back button when null. */
  previousLabel: string | null;
  raised: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function StopNavigation({ nextLabel, previousLabel, raised, onNext, onPrevious }: StopNavigationProps) {
  if (nextLabel === null && previousLabel === null) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-20 px-4 flex gap-2 transition-all duration-500 ${
        raised ? "bottom-[196px]" : "bottom-6"
      }`}
    >
      {previousLabel !== null && (
        <button
          type="button"
          onClick={onPrevious}
          aria-label={`Previous stop: ${previousLabel}`}
          className="w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center bg-white text-gray-700 rounded-2xl shadow-lg transition-all active:scale-95 hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {nextLabel !== null && (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 min-w-0 py-3.5 text-white font-semibold text-base rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 hover:opacity-90"
          style={{ backgroundColor: ORANGE }}
        >
          <span className="flex-shrink-0">Next Stop</span>
          <span className="text-orange-200 text-sm truncate">{nextLabel}</span>
        </button>
      )}
    </div>
  );
}
