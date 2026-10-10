import { X } from "lucide-react";

interface MissionModalProps {
  open: boolean;
  onClose: () => void;
}

export function MissionModal({ open, onClose }: MissionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Why Marco Exists</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-4 text-gray-600 text-base leading-relaxed">
          <p>
            Travel has always been about stories. But most city guides give you facts,
            not feelings — opening hours, not histories. Marco was built differently.
          </p>
          <p>
            For too long, the best city experiences have been reserved for the few.
            Private guides, personalised tours, someone who actually knows the history
            behind what you're looking at — these were luxuries, accessible only to those
            who could afford them. Most people just walked past the same landmarks without
            ever truly understanding what they were looking at.
          </p>
          <p>
            Marco changes that. We believe every traveller deserves a private guide — one
            who knows every story behind every corner, speaks to you personally, and brings
            a city to life in a way no pamphlet ever could. Not just for the wealthy.
            For everyone.
          </p>
          <p className="font-medium text-gray-800">
            Our mission is simple: to democratise the private city tour experience, one
            story at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
