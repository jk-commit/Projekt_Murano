// Generates the German Hamburg tour audio with ElevenLabs into public/audio/Hamburg/de/.
// Run: npm run audio:hamburg   (reads ELEVENLABS_API_KEY from .env.local)
// Existing files are skipped so credits are not spent twice. --force regenerates them;
// add file names to regenerate only those, e.g. `npm run audio:hamburg -- --force 06_Stop3_StNikolai.mp3`.
//
// The spoken texts are scripts/Hamburg/de/<name>.txt (script v4): numbers are spelled out and foreign names
// already written phonetically (Herzog und de Möhrong, Dschordsch Gilbert Skott, Hafen-Sitti, Unesko, Elfi, Ha-Fau-Fau).
// 00_Meet_Stefanie is the guide intro on the tour's start screen, 01_Intro plays when the tour opens.
//
// Each paragraph is its own request, stitched to the previous ones (previousRequestIds, nextText) so tempo
// and mood stay constant, and the parts are joined into one MP3 per stop with a short pause between paragraphs.
//
// Voice: "Anna - Excited & Journalistic" from the ElevenLabs Voice Library, chosen on 06.11.2026 for script v4
// (replacing Ava) from four samples of the intro and stop 3.

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const TEXT_DIR = new URL("./Hamburg/de/", import.meta.url);
const AUDIO_DIR = new URL("../public/audio/Hamburg/de/", import.meta.url);
const VOICE_ID = "DEZHhPbmb8LVZmWufkCh"; // "Anna - Excited & Journalistic"
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.45, similarityBoost: 0.8, style: 0.15, speed: 1, useSpeakerBoost: true };
const PARAGRAPH_PAUSE_SECONDS = 0.6;

// Words the voice still mispronounces, replaced only on the way to ElevenLabs. Checked by transcribing the
// generated MP3s with ElevenLabs speech-to-text.
const PRONUNCIATION = [
  ["Katharinen", "Katharienen"], // the list of Hauptkirchen came out as "Katharin" ... "Michaeli"
  ["Jacobi und Michaelis", "Jacobi, und Michaelis"],
];

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyFiles = args.filter((a) => a.endsWith(".mp3"));

const speakable = (text) => PRONUNCIATION.reduce((t, [word, say]) => t.replaceAll(word, say), text);

// --- MP3 joining (ElevenLabs mp3_44100_128: MPEG-1 Layer III, 128 kbit/s, 44.1 kHz, mono, CBR) ---

const frameLength = (bytes, i) => {
  if (bytes[i] !== 0xff || (bytes[i + 1] & 0xfe) !== 0xfa || (bytes[i + 2] & 0xf0) !== 0x90) {
    throw new Error(`Unexpected MP3 frame at byte ${i}, expected 128 kbit/s MPEG-1 Layer III`);
  }
  return 417 + ((bytes[i + 2] >> 1) & 1);
};

// Audio frames only: drops the ID3 tag and the Info/Xing frame, which would make players misread the duration.
function audioFrames(bytes) {
  let i = 0;
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    i = 10 + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]);
  }
  const tag = new TextDecoder().decode(bytes.subarray(i + 21, i + 25));
  if (tag === "Info" || tag === "Xing") i += frameLength(bytes, i);
  frameLength(bytes, i);
  return bytes.subarray(i);
}

// Digital silence: frames with an empty side info decode to zero samples (1152 samples = ~26 ms each).
function silence(seconds) {
  const frame = new Uint8Array(417);
  frame.set([0xff, 0xfb, 0x90, 0xc0]);
  const count = Math.round((seconds * 44100) / 1152);
  const out = new Uint8Array(frame.length * count);
  for (let n = 0; n < count; n++) out.set(frame, n * frame.length);
  return out;
}

const concat = (parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
};

// --- Generation ---

const client = new ElevenLabsClient();
mkdirSync(AUDIO_DIR, { recursive: true });

const names = readdirSync(TEXT_DIR)
  .filter((f) => f.endsWith(".txt"))
  .sort()
  .map((f) => f.replace(/\.txt$/, ""));

for (const name of names) {
  const file = `${name}.mp3`;
  const target = new URL(file, AUDIO_DIR);
  if (onlyFiles.length > 0 && !onlyFiles.includes(file)) continue;
  if (existsSync(target) && !force) {
    console.log(`skip  ${file} (exists)`);
    continue;
  }

  const paragraphs = readFileSync(new URL(`${name}.txt`, TEXT_DIR), "utf8")
    .split(/\n\s*\n/)
    .map((p) => speakable(p.replace(/\s+/g, " ").trim()))
    .filter(Boolean);

  const parts = [];
  const requestIds = [];
  for (const [n, text] of paragraphs.entries()) {
    const { data, rawResponse } = await client.textToSpeech
      .convert(VOICE_ID, {
        text,
        modelId: MODEL_ID,
        languageCode: "de",
        voiceSettings: VOICE_SETTINGS,
        outputFormat: "mp3_44100_128",
        previousRequestIds: requestIds.slice(-3),
        nextText: paragraphs[n + 1],
      })
      .withRawResponse();
    const requestId = rawResponse.headers.get("request-id");
    if (requestId) requestIds.push(requestId);
    if (n > 0) parts.push(silence(PARAGRAPH_PAUSE_SECONDS));
    parts.push(audioFrames(new Uint8Array(await new Response(data).arrayBuffer())));
  }

  writeFileSync(target, concat(parts));
  const chars = paragraphs.reduce((sum, p) => sum + p.length, 0);
  console.log(`wrote ${file} (${paragraphs.length} paragraphs, ${chars} chars${requestIds.length < paragraphs.length ? ", no stitching ids" : ""})`);
}
