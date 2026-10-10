import { MapPin, ArrowLeft } from "lucide-react";
import { ORANGE } from "../theme";

interface TourTopBarProps {
  title: string;
  completedCount: number;
  totalPOIs: number;
  onBack: () => void;
}

export function TourTopBar({ title, completedCount, totalPOIs, onBack }: TourTopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center px-2 h-14 gap-1">
        <button
          onClick={onBack}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: ORANGE }} />
          <h1 className="text-sm font-bold text-gray-900 tracking-tight truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pr-3">
          <div className="flex gap-0.5">
            {Array.from({ length: totalPOIs }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{ backgroundColor: i < completedCount ? ORANGE : "#E5E7EB" }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-500 ml-1">
            {completedCount}/{totalPOIs}
          </span>
        </div>
      </div>
    </div>
  );
}
