import { ExternalLink, X } from "lucide-react";
import type { Stop } from "../tours";
import { ORANGE } from "../theme";

interface StopDetailSheetProps {
  stop: Stop;
  isCurrent: boolean;
  onJump: () => void;
  onClose: () => void;
}

export function StopDetailSheet({ stop, isCurrent, onJump, onClose }: StopDetailSheetProps) {
  if (!stop.position) return null;
  const { lat, lng } = stop.position;

  const mapLinks = [
    { label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` },
    { label: "Apple Maps", href: `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(stop.name)}` },
  ];

  return (
    <div
      role="dialog"
      aria-label={stop.name}
      // Above the Ask Guide button (z-index 9999).
      className="fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.10)] border-t border-gray-100 px-5 pt-4"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ORANGE }}>
            Stop {stop.markerNumber}
          </p>
          <h2 className="text-lg font-bold text-gray-900">{stop.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90 flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {mapLinks.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-all active:scale-95"
          >
            {label}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={onJump}
        disabled={isCurrent}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        style={{ backgroundColor: ORANGE }}
      >
        {isCurrent ? "You're here" : "Jump to this stop"}
      </button>
    </div>
  );
}
