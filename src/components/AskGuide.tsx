import { useRef, useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";
import { ORANGE } from "../theme";

const ASK_MARCO_URL = `${SUPABASE_URL}/functions/v1/ask-marco`;

type Status = "idle" | "recording" | "thinking" | "speaking";

interface AskGuideProps {
  tourId: string;
  guideName: string;
  /** The place the user is at or walking to; sent as context for the answer. */
  placeName: string;
  drawerVisible: boolean;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onToast: (msg: string) => void;
}

export function AskGuide({
  tourId,
  guideName,
  placeName,
  drawerVisible,
  isAudioPlaying,
  onToggleAudio,
  onToast,
}: AskGuideProps) {
  const [status, setStatus] = useState<Status>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pausedRef = useRef(false);

  const statusLabel: Record<Status, string> = {
    idle: `Tap to ask ${guideName}`,
    recording: "Recording...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  };

  const fail = useCallback(
    (msg: string) => {
      setStatus("idle");
      onToast(msg);
    },
    [onToast],
  );

  const processRecording = useCallback(
    async (audioBlob: Blob) => {
      setStatus("thinking");

      // Speech-to-text → Claude → text-to-speech, all server-side
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Not signed in");

        const formData = new FormData();
        formData.append("audio", audioBlob, "question.webm");
        formData.append("tourId", tourId);
        formData.append("poiLabel", placeName);
        const res = await fetch(ASK_MARCO_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: formData,
        });
        if (!res.ok) throw new Error("Ask guide failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.setAttribute("webkit-playsinline", "");
        audio.setAttribute("playsinline", "");
        setStatus("speaking");
        audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setStatus("idle");
          if (pausedRef.current) {
            pausedRef.current = false;
            onToggleAudio();
          }
        };
      } catch {
        fail(`${guideName} couldn't hear you — try again`);
      }
    },
    [tourId, guideName, placeName, fail, onToggleAudio],
  );

  const handleTap = useCallback(async () => {
    if (status === "thinking" || status === "speaking") return;

    if (status === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        processRecording(blob);
      };

      if (isAudioPlaying) {
        pausedRef.current = true;
        onToggleAudio();
      }

      recorder.start();
      setStatus("recording");
    } catch {
      fail(`${guideName} couldn't hear you — try again`);
    }
  }, [status, guideName, isAudioPlaying, onToggleAudio, processRecording, fail]);

  const bottomPx = drawerVisible ? 264 : 100;

  return (
    <div
      style={{
        position: "fixed",
        right: "20px",
        bottom: `${bottomPx}px`,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        transition: "bottom 0.5s ease",
      }}
    >
      <button
        onClick={handleTap}
        disabled={status === "thinking"}
        className={`rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95
          ${status === "recording" ? "animate-pulse" : "hover:opacity-90"}
          ${status === "thinking" ? "opacity-60 cursor-not-allowed" : ""}
        `}
        style={{
          width: "56px",
          height: "56px",
          minWidth: "56px",
          minHeight: "56px",
          backgroundColor: status === "recording" ? "#EF4444" : ORANGE,
          touchAction: "manipulation",
        }}
        aria-label={`Ask ${guideName}`}
      >
        <Mic className="w-5 h-5" />
      </button>
      <span className="text-xs font-medium text-gray-700 bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
        {statusLabel[status]}
      </span>
    </div>
  );
}
