import { useState } from "react";
import { CheckCircle, Share2, Star } from "lucide-react";

import type { Tour } from "../tours";
import { ORANGE, ORANGE_TINT } from "../theme";

interface TourCompleteOverlayProps {
  tour: Tour;
  onBackToHome: () => void;
}

export function TourCompleteOverlay({ tour, onBackToHome }: TourCompleteOverlayProps) {
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: tour.shareText, url: window.location.origin }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${tour.shareText} ${window.location.origin}`).catch(() => {});
    }
  };

  const handleStar = (n: number) => {
    setRating(n);
    setRatingSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-center">
      {/* Checkmark */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: ORANGE_TINT }}
      >
        <CheckCircle className="w-10 h-10" style={{ color: ORANGE }} />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Tour Complete!</h1>
      <p className="text-gray-500 mb-10 max-w-xs leading-relaxed">
        {tour.completeText}
      </p>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-base shadow-lg transition-all active:scale-95 hover:opacity-90 mb-8"
        style={{ backgroundColor: ORANGE }}
      >
        <Share2 className="w-5 h-5" />
        Share this experience
      </button>

      {/* Star rating */}
      <div className="mb-10">
        {!ratingSubmitted ? (
          <>
            <p className="text-sm text-gray-500 mb-4">How was your experience?</p>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleStar(n)}
                  className="w-12 h-12 flex items-center justify-center transition-transform active:scale-90"
                  aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className="w-8 h-8"
                    fill={n <= rating ? "#F59E0B" : "none"}
                    stroke={n <= rating ? "#F59E0B" : "#D1D5DB"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm font-medium text-gray-600">Thanks for the feedback!</p>
        )}
      </div>

      {/* Back to home */}
      <button
        onClick={onBackToHome}
        className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
      >
        Back to home
      </button>
    </div>
  );
}
