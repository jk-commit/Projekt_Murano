import { useRef, useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";
import { ORANGE } from "../theme";

const ASK_MARCO_URL = `${SUPABASE_URL}/functions/v1/ask-marco`;

/** "ready": the answer has arrived but the browser blocked autoplay, so it waits for a tap. */
type Status = "idle" | "recording" | "thinking" | "ready" | "speaking";

let silentClipUrl: string | undefined;

/** 0.1 s of silence as a WAV blob URL, used to unlock audio playback during a tap. */
function silentClip(): string {
  if (!silentClipUrl) {
    const samples = 800; // 8 kHz, 8-bit mono
    const view = new DataView(new ArrayBuffer(44 + samples));
    const text = (offset: number, s: string) =>
      [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    text(0, "RIFF");
    view.setUint32(4, 36 + samples, true);
    text(8, "WAVEfmt ");
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, 8000, true); // sample rate
    view.setUint32(28, 8000, true); // byte rate
    view.setUint16(32, 1, true); // block align
    view.setUint16(34, 8, true); // bits per sample
    text(36, "data");
    view.setUint32(40, samples, true);
    new Uint8Array(view.buffer, 44).fill(128); // 8-bit silence
    silentClipUrl = URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
  }
  return silentClipUrl;
}

interface AskGuideProps {
  tourId: string;
  /** Language code of the tour variant ("en", "de"); the guide answers in it. */
  language: string;
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
  language,
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
  const answerAudioRef = useRef<HTMLAudioElement | null>(null);
  const answerUrlRef = useRef<string | null>(null);

  const statusLabel: Record<Status, string> = {
    idle: `Tap to ask ${guideName}`,
    recording: "Recording...",
    thinking: "Thinking...",
    ready: `Tap to hear ${guideName}`,
    speaking: "Speaking...",
  };

  const fail = useCallback(
    (msg: string) => {
      setStatus("idle");
      onToast(msg);
    },
    [onToast],
  );

  // Mobile browsers (iOS Safari above all) only start audio from a tap, and the answer arrives
  // seconds later. So one element is unlocked with a silent clip on the tap that ends the
  // recording, and the answer then plays on that same element.
  const answerAudio = useCallback(() => {
    if (!answerAudioRef.current) {
      const audio = new Audio();
      audio.setAttribute("webkit-playsinline", "");
      audio.setAttribute("playsinline", "");
      answerAudioRef.current = audio;
    }
    return answerAudioRef.current;
  }, []);

  // Ends the answer: frees its audio and resumes the tour audio if asking had paused it.
  const finishAnswer = useCallback(() => {
    const audio = answerAudio();
    audio.onended = null;
    audio.onerror = null;
    if (answerUrlRef.current) URL.revokeObjectURL(answerUrlRef.current);
    answerUrlRef.current = null;
    if (pausedRef.current) {
      pausedRef.current = false;
      onToggleAudio();
    }
  }, [answerAudio, onToggleAudio]);

  const playAnswer = useCallback(async () => {
    try {
      await answerAudio().play();
      setStatus("speaking");
    } catch {
      setStatus("ready");
    }
  }, [answerAudio]);

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
        formData.append("language", language);
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
        if (blob.size === 0) throw new Error("Empty answer");

        const url = URL.createObjectURL(blob);
        answerUrlRef.current = url;
        const audio = answerAudio();
        audio.onended = () => {
          finishAnswer();
          setStatus("idle");
        };
        audio.onerror = () => {
          finishAnswer();
          fail(`${guideName}'s answer couldn't be played — try again`);
        };
        audio.src = url;
        await playAnswer();
      } catch {
        fail(`${guideName} couldn't hear you — try again`);
      }
    },
    [tourId, language, guideName, placeName, fail, answerAudio, finishAnswer, playAnswer],
  );

  const handleTap = useCallback(async () => {
    if (status === "thinking" || status === "speaking") return;

    if (status === "ready") {
      playAnswer();
      return;
    }

    if (status === "recording") {
      // This tap is the last user gesture before the answer arrives: unlock playback now.
      const audio = answerAudio();
      audio.src = silentClip();
      audio.play().catch(() => {});
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
  }, [status, guideName, isAudioPlaying, onToggleAudio, processRecording, fail, answerAudio, playAnswer]);

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
