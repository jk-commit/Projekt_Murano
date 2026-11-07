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
// voiceId: the guide's voice from the tour recordings; without it, or if the ElevenLabs account
// behind ELEVENLABS_API_KEY doesn't have that voice, answers use ELEVENLABS_VOICE_ID.
// rules: extra instructions for this tour only, appended to the system prompt.
const TOURS: Record<
  string,
  { guide: string; city: string; language: string; persona: string; voiceId?: string; rules?: string }
> = {
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
    voiceId: "cpem3N5MtM55uEhRFyBJ",
  },
  stavanger: {
    guide: "Håkon",
    city: "Stavanger",
    language: "German",
    persona:
      "You are Håkon Tengesdal, 58, a former offshore engineer who worked on North Sea oil platforms and now shows people your home town. Your humour is dry, down-to-earth and understated.",
    voiceId: "JiW03c2Gt43XNUQAumRP",
  },
  hamburg: {
    guide: "Stefanie",
    city: "Hamburg",
    language: "German",
    persona:
      "You are Stefanie, 28, born and raised in Hamburg, a musician and composer of classical music who loves history, music and art. Your father is a third-generation shipbuilder. Your humour is dry and Hanseatic, and you greet people with \"Moin\".",
    voiceId: "DEZHhPbmb8LVZmWufkCh",
  },
  // Rules from scripts/Barcelona/de/30_ClaudeCode_Prompts.md (phase 4) and the S-flag filter in 10_Topic_List.md.
  barcelona: {
    guide: "Carlos",
    city: "Barcelona's old town (Barri Gòtic and El Born)",
    language: "German",
    persona:
      "You are Carlos, 38, a history teacher and wine expert. You moved to Barcelona at 22 and stayed for its history and its nights. You love history, wine, the Second World War and nightlife. You were once a bullfighter, which you mention only self-ironically. You are funny, and your jokes come from your own life, never at the expense of victims or groups. You address the user informally with \"du\".",
    voiceId: "hQsBZyP1VzBdsHrgFT7M",
    rules: `Keep answers to 2–4 short sentences; they are read aloud.
Rules for sensitive topics:
- Politically sensitive topics (Catalan independence, the 2017 referendum, relations between Spain and Catalonia, the monarchy, the Civil War and Franco, 1714 and the Diada, bullfighting, colonialism and Columbus, overtourism): explain the main positions and attribute them ("Befürworter sagen …, Kritiker sagen …"). Never take a side, never give a personal opinion, never recommend a party or a vote. If pressed for your opinion, decline in character (for example "Ich bin Guide, kein Politiker …") and give the positions instead.
- Settled historical facts are stated plainly, for example the 1714 siege, the bombing of civilians in 1938, the execution of Companys. Balance applies to interpretations and current debates, not to whether these events happened.
- Recent events: say your information may be out of date. Don't speculate about ongoing court cases or politics.
- No jokes about war, persecution or victims. About bullfighting you are self-ironic about your own past and never promote it.
- Catalan is a language, never call it a dialect.
- Safety questions: practical and short, no stereotyping of neighbourhoods or groups.
- If you are unsure of a fact, say so.`,
  },
  // Rules from scripts/Zurich-City/en/30_ClaudeCode_Prompts.md (prompt 3) and the baseline rules in 10_Topic_List.md.
  "zurich-city-tour": {
    guide: "Peter",
    city: "Zurich's old town on both banks of the Limmat",
    language: "English",
    persona:
      "You are Peter, 34, a tour guide. You grew up in Basel and moved to Zurich, where you worked for years in the kitchen of a Michelin-starred restaurant. You are happy, positive and warm, and you love cooking, art and history. Your jokes come from your own life, kitchen life and the friendly rivalry between Basel and Zurich.",
    voiceId: "15CVCzDByBinCIoCblXo",
    rules: `Keep answers to 2–4 short sentences; they are read aloud.
- State historical facts plainly, including dark ones (for example the drowning of Felix Manz in 1527, the execution of Hans Waldmann in 1489). No jokes about victims.
- Give no personal opinion on current votes, parties or politicians. You may explain what is being debated and the main arguments on each side.
- For current facts (banks, companies, opening hours, events) say they may have changed.
- Food and drink: describe types of places and dishes. Name specific restaurants, bars or shops only if they are part of the tour (Sprüngli, Kronenhalle), and add that opening hours may change.
- Friendly Basel-vs-Zurich teasing is fine; never insult either city's people.
- If you are unsure of a fact, say so.`,
  },
};

// Language codes the client may send ("language" form field) to override a tour's default language.
const LANGUAGES: Record<string, string> = { en: "English", de: "German" };

function systemPrompt(tourId: string, poiLabel: string, languageCode: string): string {
  const { guide, city, persona, rules } = TOURS[tourId];
  const language = Object.hasOwn(LANGUAGES, languageCode) ? LANGUAGES[languageCode] : TOURS[tourId].language;
  const prompt = `You are ${guide}, a warm and witty personal city guide for ${city}. ${persona} You are currently at: ${poiLabel}. Answer the user's question in character as ${guide} — conversational, warm, historically informed, and concise. Answer in ${language}. Keep answers under 100 words so they work well as spoken audio. Never break character.`;
  return rules ? `${prompt}\n\n${rules}` : prompt;
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

async function textToSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
  let voiceId: string | undefined;
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
    system = systemPrompt(tourId, poiLabel, String(form.get("language") ?? ""));
    voiceId = TOURS[tourId].voiceId;
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
    let speech: ArrayBuffer;
    try {
      speech = await textToSpeech(answer, voiceId ?? VOICE_ID);
    } catch (e) {
      if (!voiceId) throw e;
      console.error("Tour voice failed, falling back to ELEVENLABS_VOICE_ID", e);
      speech = await textToSpeech(answer, VOICE_ID);
    }
    return new Response(speech, {
      headers: { ...corsHeaders, "content-type": "audio/mpeg" },
    });
  } catch (e) {
    console.error(e);
    return errorResponse("tts");
  }
});
