import { forwardRef } from "react";
import { ChevronRight } from "lucide-react";
import { poiStops, type Tour } from "../tours";
import { ORANGE } from "../theme";

interface TourCardProps {
  tour: Tour;
  highlighted: boolean;
  onSelect: () => void;
}

export const TourCard = forwardRef<HTMLDivElement, TourCardProps>(function TourCard(
  { tour, highlighted, onSelect },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`rounded-2xl overflow-hidden shadow-sm border transition-all duration-500 ${
        highlighted ? "scale-[1.01]" : "border-gray-100"
      }`}
      style={highlighted ? { borderColor: ORANGE, boxShadow: `0 0 0 2px ${ORANGE}` } : {}}
    >
      <div className="h-44 relative bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
        <img src={tour.heroImage} alt={tour.shortTitle} className="w-full h-full object-cover" />
        <div className="absolute bottom-3 left-4 z-20">
          <span className="text-xs font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {tour.region}
          </span>
        </div>
        {tour.heroCredit && (
          <div className="absolute bottom-3 right-4 z-20">
            <span className="text-[10px] text-white/60">{tour.heroCredit}</span>
          </div>
        )}
        {highlighted && (
          <div className="absolute top-3 right-3 z-20">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: ORANGE }}
            >
              Near you!
            </span>
          </div>
        )}
      </div>
      <div className="bg-white p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{tour.shortTitle}</h3>
        <p className="text-sm text-gray-500 mb-4">
          {poiStops(tour).length} stops &middot; {tour.duration} &middot; {tour.language.label}
        </p>
        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: ORANGE }}
        >
          View Tour
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
