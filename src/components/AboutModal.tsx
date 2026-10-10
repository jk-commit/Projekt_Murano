import { X } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Meet Marco</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-4 text-gray-600 text-base leading-relaxed">
          <p>
            Marco is your personal city guide — part historian, part storyteller,
            part local friend.
          </p>
          <p>
            He spent 15 years working in finance before realising the most interesting
            stories weren't in boardrooms — they were in the streets outside. These days,
            Marco spends his time obsessing over the hidden histories of cities across
            Europe, turning dusty archives into the kind of stories you actually want to
            hear on a Sunday afternoon walk.
          </p>
          <p>
            Marco is powered by a mix of carefully researched scripts and real-time AI
            — so he can answer your questions, go on tangents, and point out things most
            guides would walk straight past.
          </p>
          <p className="text-sm text-gray-400 italic">
            Currently available in Zurich. More cities coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
