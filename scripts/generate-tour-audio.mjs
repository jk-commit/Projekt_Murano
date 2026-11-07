// Generates a scripted tour's audio with ElevenLabs into public/audio/<Folder>/<lang>/.
// Run: npm run audio:<tour>   (= node --env-file=.env.local scripts/generate-tour-audio.mjs <tour id>;
// reads ELEVENLABS_API_KEY and the tour's voice variable from .env.local; tours in scripted-tours.mjs)
//
// One MP3 per clip of src/tours/<dir>/content.ts (generated from the markdown by `npm run content:<tour>`):
// every fixed core segment, FULL and CALLBACK block, approach, location check, bridge, filler, intro, outro and
// system text — also the ones the fixed tour doesn't play yet, so the dynamic tour can use the same files.
// The text is spoken exactly as written; foreign names are already respelled for TTS.
//
//   npm run audio:barcelona -- --only pronunciation   test file with all respelled names → scripts/<Folder>/pronunciation_test.mp3
//   npm run audio:barcelona -- --only P04             one POI (all files starting with "P04_"); also B03, F05, INTRO, S-NAH, …
//   npm run audio:barcelona -- --only P04_approach.mp3   single files
//   npm run audio:barcelona -- --changed              also regenerate files whose text changed since they were made
//   npm run audio:barcelona -- --force                regenerate everything selected, even unchanged files
//
// Existing files are skipped so credits are not spent twice. scripts/<Folder>/audio-manifest.json remembers the
// text and voice each file was made from; files whose text changed since are listed as stale.

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { scriptedTour } from "./scripted-tours.mjs";

const tour = scriptedTour(process.argv[2]);
const { [tour.exportName]: content } = await import(tour.contentModule);
const AUDIO_DIR = tour.audioDir;
const MANIFEST = tour.manifestFile;
const README = new URL("00_README.md", tour.srcDir);
const TEST_FILE = tour.testFile;
const VOICE_ID = process.env[tour.voice.env] || tour.voice.fallback;
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.45, similarityBoost: 0.8, style: 0.15, speed: 1, useSpeakerBoost: true };
const PARAGRAPH_PAUSE_SECONDS = 0.6;
const PRONUNCIATION = tour.pronunciation;

if (!VOICE_ID) {
  console.error(`No voice for ${tour.id}: set ${tour.voice.env} in .env.local`);
  process.exit(1);
}

const args = process.argv.slice(3);
const force = args.includes("--force");
const changed = args.includes("--changed");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex === -1 ? [] : args.slice(onlyIndex + 1).filter((a) => !a.startsWith("--"));

const speakable = (text) => PRONUNCIATION.reduce((t, [word, say]) => t.replaceAll(word, say), text);
const fingerprint = (text) => createHash("sha256").update(`${VOICE_ID}\n${MODEL_ID}\n${speakable(text)}`).digest("hex").slice(0, 16);

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

// --- Clips ---

const c = content;
const clips = [
  ...Object.values(c.texts),
  ...c.pois.flatMap((p) => [p.approach, ...(p.locationCheck ? [p.locationCheck] : []), ...p.core]),
  ...c.bridges,
  ...c.fillers,
].map((clip) => ({ file: clip.audio.split("/").pop(), text: clip.text }));

const files = new Set();
for (const { file } of clips) {
  if (files.has(file)) throw new Error(`Two clips share the file name ${file}`);
  files.add(file);
}

// The respelled column ("Im Skript", "In the script") of the respelling table in 00_README.md, one name per paragraph.
function pronunciationTest() {
  const readme = readFileSync(README, "utf8").replace(/\r\n/g, "\n");
  const table = readme.split(`## ${tour.respellingsHeading}`)[1]?.split("\n## ")[0] ?? "";
  const words = table
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((cells) => cells.length > 3 && cells[2] && !["Im Skript", "In the script"].includes(cells[2]) && !/^-+$/.test(cells[2]))
    .map((cells) => cells[2]);
  if (words.length === 0) throw new Error("No pronunciation table found in 00_README.md");
  return words.map((w) => `${w}.`).join("\n\n");
}

const selected =
  only.length === 0
    ? clips
    : clips.filter(({ file }) => only.some((o) => file === o || file === `${o}.mp3` || file.startsWith(`${o}_`)));
if (only.length > 0 && selected.length === 0 && !only.includes("pronunciation")) {
  console.error(`Nothing matches --only ${only.join(" ")}`);
  process.exit(1);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
const saveManifest = () => writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

// --- Generation ---

const client = new ElevenLabsClient();
mkdirSync(AUDIO_DIR, { recursive: true });

async function speak(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => speakable(p.replace(/\s+/g, " ").trim()))
    .filter(Boolean);
  const parts = [];
  const requestIds = [];
  for (const [n, paragraph] of paragraphs.entries()) {
    const { data, rawResponse } = await client.textToSpeech
      .convert(VOICE_ID, {
        text: paragraph,
        modelId: MODEL_ID,
        languageCode: tour.lang,
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
  return { mp3: concat(parts), paragraphs: paragraphs.length, chars: paragraphs.reduce((n, p) => n + p.length, 0) };
}

if (only.includes("pronunciation")) {
  const { mp3, paragraphs, chars } = await speak(pronunciationTest());
  writeFileSync(TEST_FILE, mp3);
  console.log(`wrote scripts/${tour.folder}/pronunciation_test.mp3 (${paragraphs} names, ${chars} chars)`);
}

const stale = [];
for (const { file, text } of selected) {
  const target = new URL(file, AUDIO_DIR);
  const print = fingerprint(text);
  const isStale = existsSync(target) && manifest[file] && manifest[file] !== print;
  if (existsSync(target) && !force && !(changed && isStale)) {
    if (isStale) stale.push(file);
    else console.log(`skip  ${file} (exists)`);
    continue;
  }
  const { mp3, paragraphs, chars } = await speak(text);
  writeFileSync(target, mp3);
  manifest[file] = print;
  saveManifest();
  console.log(`wrote ${file} (${paragraphs} paragraphs, ${chars} chars)`);
}

if (stale.length > 0) {
  console.warn(`\n${stale.length} file(s) were made from an older text or voice; regenerate with --changed:\n  ${stale.join("\n  ")}`);
}
