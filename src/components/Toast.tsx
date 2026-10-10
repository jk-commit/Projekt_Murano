import { ORANGE } from "../theme";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: ORANGE }}
      >
        {message}
      </div>
    </div>
  );
}
