// Ask the tour guide: speech-to-text → Claude → text-to-speech.
// Secret API keys live only here (Supabase secrets), never in the frontend.
// verify_jwt = true in config.toml, so only signed-in users reach this code.

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") ?? "9IzcwKmvwJcw58h3KnlH";
const CLAUDE_MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-4-6";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_LABEL_LENGTH = 80;

// One entry per tour; ids match src/tours/*.ts. Unknown tour ids are rejected,
// so the client can only pick a guide, never write its own prompt.
const TOURS: Record<string, { guide: string; city: string; language: string; persona: string }> = {
  zurich: {
    guide: "Marco",
    city: "Zurich Altstadt",
    language: "English",
    persona:
      "You spent 15 years in finance before becoming a self-taught historian. You know every story behind every cobblestone in Zurich.",
  },
  kitzingen: {
    guide: "Stefanie",
    city: "Kitzingen Altstadt",
    language: "German",
    persona: "You grew up in Kitzingen and know the history of its old town, the Main river and its traditions by heart.",
  },
  umea: {
    guide: "Elin",
    city: "Umeå",
    language: "English",
    persona: "You are a local who loves Umeå's culture, its riverside and the stories of its people.",
  },
};

function systemPrompt(tourId: string, poiLabel: string): string {
  const { guide, city, language, persona } = TOURS[tourId];
  return `You are ${guide}, a warm and witty personal city guide for ${city}. ${persona} You are currently at: ${poiLabel}. Answer the user's question in character as ${guide} — conversational, warm, historically informed, and concise. Answer in ${language}. Keep answers under 100 words so they work well as spoken audio. Never break character.`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function errorResponse(stage: string, status = 502) {
  return new Response(JSON.stringify({ error: "The guide couldn't answer", stage }), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// verify_jwt also lets the public anon key through, so confirm the token belongs to a real user.
async function isSignedInUser(req: Request): Promise<boolean> {
  const authorization = req.headers.get("authorization");
  if (!authorization) return false;
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: { authorization, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
  });
  if (!res.ok) return false;
  const user = await res.json();
  return Boolean(user?.id);
}

async function speechToText(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audio, "question.webm");
  formData.append("model_id", "scribe_v1");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_KEY },
    body: formData,
  });
  if (!res.ok) throw new Error(`STT ${res.status}: ${await res.text()}`);
  const { text } = await res.json();
  if (!text?.trim()) throw new Error("Empty transcription");
  return text.trim();
}

async function askClaude(question: string, system: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (!text) throw new Error("Empty Claude response");
  return text;
}

async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  return await res.arrayBuffer();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("method", 405);
  if (!ANTHROPIC_KEY || !ELEVENLABS_KEY) {
    console.error("Missing ANTHROPIC_API_KEY or ELEVENLABS_API_KEY secret");
    return errorResponse("config", 500);
  }
  if (!(await isSignedInUser(req))) return errorResponse("auth", 401);

  let audio: Blob;
  let system: string;
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_AUDIO_BYTES) {
      return errorResponse("input", 400);
    }
    audio = file;
    const tourId = String(form.get("tourId") ?? "zurich");
    if (!Object.hasOwn(TOURS, tourId)) return errorResponse("tour", 400);
    const poiLabel = String(form.get("poiLabel") ?? TOURS[tourId].city).slice(0, MAX_LABEL_LENGTH);
    system = systemPrompt(tourId, poiLabel);
  } catch {
    return errorResponse("input", 400);
  }

  let question: string;
  try {
    question = await speechToText(audio);
  } catch (e) {
    console.error(e);
    return errorResponse("stt");
  }

  let answer: string;
  try {
    answer = await askClaude(question, system);
  } catch (e) {
    console.error(e);
    return errorResponse("claude");
  }

  try {
    const speech = await textToSpeech(answer);
    return new Response(speech, {
      headers: { ...corsHeaders, "content-type": "audio/mpeg" },
    });
  } catch (e) {
    console.error(e);
    return errorResponse("tts");
  }
});
