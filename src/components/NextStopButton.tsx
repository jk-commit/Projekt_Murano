import { ORANGE } from "../theme";

interface NextStopButtonProps {
  label: string;
  raised: boolean;
  onClick: () => void;
}

export function NextStopButton({ label, raised, onClick }: NextStopButtonProps) {
  return (
    <div
      className={`fixed left-0 right-0 z-20 px-4 transition-all duration-500 ${
        raised ? "bottom-[196px]" : "bottom-6"
      }`}
    >
      <button
        onClick={onClick}
        className="w-full py-3.5 text-white font-semibold text-base rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 hover:opacity-90"
        style={{ backgroundColor: ORANGE }}
      >
        <span>Next Stop</span>
        <span className="text-orange-200 text-sm truncate">{label}</span>
      </button>
    </div>
  );
}
