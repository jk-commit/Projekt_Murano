// Turns the Barcelona markdown in scripts/Barcelona/de/ into src/tours/barcelona/content.ts.
// Run: npm run content:barcelona
//
// The markdown is the single source for the fixed tour now and the dynamic tour later; never edit
// content.ts by hand. The parser fails loudly when a file breaks the format (see README "Wie ein
// POI-Skript aufgebaut ist") or when the files disagree with each other: topic tags vs. blocks, the
// JSON in 00_README.md vs. the POI files, topic ids vs. 10_Topic_List.md, bridge table vs. bridge texts.
//
// Spoken text is taken exactly as written (Catalan names are already respelled for TTS). Lines in
// *italics* are notes for the app and are not spoken.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

const SRC_DIR = new URL("./Barcelona/de/", import.meta.url);
const OUT_FILE = new URL("../src/tours/barcelona/content.ts", import.meta.url);
const AUDIO_BASE = "/audio/Barcelona/de";

// Differences between the README JSON and the POI files that are known and accepted for now.
// Fix them in the markdown, then remove the entry here — an entry that no longer matches is an error too.
const KNOWN_README_DIFFERENCES = [
  { poi: "P01", field: "flags", why: "Table has V (Brossa letters, frieze date), README JSON has no flag" },
];

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const read = (name) => readFileSync(new URL(name, SRC_DIR), "utf8").replace(/\r\n/g, "\n");

const TOPIC_ID = /\b(?:[A-Z]{3}|C20)-\d{2}\b/g;
const topicIds = (s) => [...s.matchAll(TOPIC_ID)].map((m) => m[0]);

// --- Helpers -----------------------------------------------------------------------------------

/** Splits markdown into sections by heading level: [{ heading, body }]. */
function sections(md, level) {
  const marker = "#".repeat(level) + " ";
  const out = [];
  let current = null;
  for (const line of md.split("\n")) {
    if (line.startsWith(marker)) {
      current = { heading: line.slice(marker.length).trim(), lines: [] };
      out.push(current);
    } else if (current) {
      // A higher-level heading ends the section.
      if (/^#{1,6} /.test(line) && line.match(/^#+/)[0].length < level) current = null;
      else current.lines.push(line);
    }
  }
  return out.map(({ heading, lines }) => ({ heading, body: lines.join("\n") }));
}

/** Spoken paragraphs: drops notes in *italics*, separators, tables and blank lines; joins wrapped lines. */
function spoken(body) {
  return body
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .filter((l) => !/^\s*\*[^*].*\*\s*$/.test(l) && !/^\s*-{3,}\s*$/.test(l) && !/^\s*\|/.test(l))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

const clip = (paragraphs, file) => ({ text: paragraphs.join("\n\n"), audio: `${AUDIO_BASE}/${file}.mp3` });

function tableRows(body) {
  const rows = new Map();
  for (const line of body.split("\n")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length >= 2 && !/^-+$/.test(cells[0])) rows.set(cells[0], cells.slice(1));
  }
  return rows;
}

const parseNumber = (s, where) => {
  const n = Number(s);
  if (!Number.isFinite(n)) fail(where, `not a number: "${s}"`);
  return n;
};

// --- Topic list ----------------------------------------------------------------------------------

const knownTopics = new Map();
for (const line of read("10_Topic_List.md").split("\n")) {
  const m = line.match(/^\|\s*((?:[A-Z]{3}|C20)-\d{2})\s*\|\s*([^|]+?)\s*\|/);
  if (m) knownTopics.set(m[1], m[2]);
}
if (knownTopics.size === 0) fail("10_Topic_List.md", "no topic ids found");
const checkTopic = (where, id) => {
  if (!knownTopics.has(id)) fail(where, `topic ${id} is not in 10_Topic_List.md`);
};

// Every topic id anywhere in the scripts — tag rows, [[…]] block markers, filler headings, running text —
// must be on the list. "SOC-08/09" counts as SOC-08 and SOC-09.
const scriptFiles = readdirSync(SRC_DIR).filter((f) => /^(P\d{2}_.*|01_.*|20_.*)\.md$/.test(f)).sort();
let topicMentions = 0;
for (const f of scriptFiles) {
  const md = read(f).replace(/\b((?:[A-Z]{3}|C20)-)(\d{2})\/(\d{2})\b/g, "$1$2, $1$3");
  md.split("\n").forEach((line, i) => {
    for (const id of topicIds(line)) {
      topicMentions++;
      checkTopic(`${f}:${i + 1}`, id);
    }
  });
}

// --- Theme groups and bridges (20_Verbindungen.md) ----------------------------------------------

const verbindungen = read("20_Verbindungen.md");
const vSections = sections(verbindungen, 3);
const groupSection = vSections.find((s) => s.heading.startsWith("Themengruppen"));
const bridgeRuleSection = vSections.find((s) => s.heading.startsWith("Welche Brücke wann"));

const groups = {};
const groupOfPoi = {};
for (const [id, [label, pois]] of tableRows(groupSection?.body ?? "")) {
  if (id === "Gruppe") continue;
  groups[id] = label;
  for (const poi of pois.split(",").map((p) => p.trim())) groupOfPoi[poi] = id;
}

/** "beliebig" | "ROM" | "MOD oder 1714" | "beliebig außer KRIEG/JUD" → { any, only, except } */
function groupSet(s, where) {
  s = s.trim();
  const except = s.match(/^beliebig außer (.+)$/);
  if (except) return { except: except[1].split("/").map((g) => g.trim()) };
  if (s === "beliebig") return {};
  return { only: s.split(" oder ").map((g) => g.trim()) };
}

const bridgeRules = [];
for (const [id, [route]] of tableRows(bridgeRuleSection?.body ?? "")) {
  if (id === "Brücke") continue;
  const [from, to] = route.split("→");
  if (!to) {
    fail("20_Verbindungen.md", `bridge ${id}: cannot read route "${route}"`);
    continue;
  }
  const rule = { id, from: groupSet(from, id), to: groupSet(to, id) };
  for (const g of [...(rule.from.only ?? []), ...(rule.from.except ?? []), ...(rule.to.only ?? []), ...(rule.to.except ?? [])]) {
    if (!groups[g]) fail("20_Verbindungen.md", `bridge ${id} names unknown group ${g}`);
  }
  bridgeRules.push(rule);
}

const bridgeTexts = new Map();
const fillers = [];
for (const s of vSections) {
  const m = s.heading.match(/^([BF]\d{2}) — (.+)$/);
  if (!m) continue;
  const [, id, rest] = m;
  const paragraphs = spoken(s.body);
  if (paragraphs.length === 0) fail("20_Verbindungen.md", `${id} has no spoken text`);
  if (id.startsWith("B")) {
    bridgeTexts.set(id, clip(paragraphs, id));
  } else {
    const title = rest.replace(/\s*\(.*\)\s*$/, "");
    const paren = rest.match(/\(([^)]*)\)\s*$/)?.[1] ?? "";
    // "SOC-08/09" means SOC-08 and SOC-09.
    const topics = paren
      .replace(/\b((?:[A-Z]{3}|C20)-)(\d{2})\/(\d{2})\b/g, "$1$2, $1$3")
      .match(TOPIC_ID) ?? [];
    topics.forEach((t) => checkTopic(id, t));
    const trigger = s.body.match(/Trigger:\s*([\d.]+),\s*([\d.]+).*?Radius\s*(\d+)\s*m/);
    fillers.push({
      id,
      title,
      topics,
      sensitive: /\bS\b/.test(paren.replace(TOPIC_ID, "")),
      ...(trigger && {
        trigger: { position: { lat: Number(trigger[1]), lng: Number(trigger[2]) }, radius: Number(trigger[3]) },
      }),
      ...clip(paragraphs, id),
    });
  }
}

const bridges = bridgeRules.map((rule) => {
  const text = bridgeTexts.get(rule.id);
  if (!text) fail("20_Verbindungen.md", `bridge ${rule.id} is in the table but has no text`);
  return { ...rule, ...text };
});
for (const id of bridgeTexts.keys()) {
  if (!bridgeRules.some((r) => r.id === id)) fail("20_Verbindungen.md", `bridge ${id} has text but is not in the table`);
}

// --- Intro, outro and system texts ----------------------------------------------------------------

const texts = {};
for (const level of [2, 3]) {
  for (const s of sections(read("01_Carlos_Intro_und_Systemtexte.md"), level)) {
    // "🎙 MEET MARCO — Guide-Vorstellung (~25 s)" → MEET, "🎙 OUTRO (~30 s)" → OUTRO, "S-NAH — …" → S-NAH
    const m = s.heading.match(/^(?:🎙\s*)?([A-Z][A-Z-]*)\b/);
    if (!m || (level === 2 && !s.heading.startsWith("🎙")) || (level === 3 && !m[1].startsWith("S-"))) continue;
    const id = m[1];
    const body = level === 2 ? s.body.split(/\n### /)[0] : s.body;
    const paragraphs = spoken(body);
    if (paragraphs.length === 0) fail("01_Carlos_Intro_und_Systemtexte.md", `${id} has no spoken text`);
    if (texts[id]) fail("01_Carlos_Intro_und_Systemtexte.md", `${id} appears twice`);
    texts[id] = clip(paragraphs, id);
  }
}
for (const id of ["MEET", "INTRO", "INTRO-WEIT", "OUTRO", "S-NAH", "S-STEHEN", "S-QA-HINWEIS", "S-SICHER-ALLG"]) {
  if (!texts[id]) fail("01_Carlos_Intro_und_Systemtexte.md", `missing ${id}`);
}

// --- POIs -----------------------------------------------------------------------------------------

function parseTopicField(cell, where) {
  if (/^[–-]$/.test(cell)) return { withBlock: [], fixedText: [] };
  const allFixed = /alles fester Text/.test(cell);
  const withBlock = [];
  const fixedText = [];
  const matches = [...cell.matchAll(TOPIC_ID)];
  matches.forEach((m, i) => {
    checkTopic(where, m[0]);
    const own = cell.slice(m.index, matches[i + 1]?.index ?? cell.length);
    (allFixed || /fester Text/.test(own) ? fixedText : withBlock).push(m[0]);
  });
  return { withBlock, fixedText };
}

function parseFlags(cell) {
  const withoutNotes = cell.replace(/\([^)]*\)/g, "");
  const flags = [...new Set([...withoutNotes.matchAll(/(?<![\w-])\*{0,2}([SV])\*{0,2}(?![\w-])/g)].map((m) => m[1]))];
  return { flags: flags.sort(), pickpockets: /Taschendiebe/.test(cell) };
}

/** Core text → ordered segments; a topic block becomes a full and/or a callback segment with one slot number. */
function parseCore(body, poiId) {
  const where = `${poiId} KERN`;
  const segments = [];
  let slot = 0;
  let fixed = [];
  let block = null; // { topic, part: "full" | "callback", full: [], callback: [] }

  const flushFixed = () => {
    const paragraphs = spoken(fixed.join("\n"));
    fixed = [];
    if (paragraphs.length === 0) return;
    slot++;
    segments.push({ kind: "fixed", ...clip(paragraphs, `${poiId}_core_${String(slot).padStart(2, "0")}_fixed`) });
  };

  for (const line of body.split("\n")) {
    const marker = line.trim().match(/^\[\[(\/)?((?:[A-Z]{3}|C20)-\d{2})(?: (FULL|CALLBACK))?\]\]$/);
    if (!marker) {
      if (line.includes("[[") || line.includes("]]")) fail(where, `unreadable marker: ${line.trim()}`);
      if (block) block[block.part].push(line);
      else fixed.push(line);
      continue;
    }
    const [, closing, topic, part] = marker;
    if (closing) {
      if (!block || block.topic !== topic) {
        fail(where, `[[/${topic}]] without an open ${topic} block`);
        continue;
      }
      slot++;
      const n = String(slot).padStart(2, "0");
      for (const kind of ["full", "callback"]) {
        if (!block.seen.has(kind)) continue;
        const paragraphs = spoken(block[kind].join("\n"));
        if (paragraphs.length === 0) fail(where, `${topic} ${kind.toUpperCase()} is empty`);
        segments.push({ kind, topicId: topic, ...clip(paragraphs, `${poiId}_core_${n}_${topic}_${kind}`) });
      }
      block = null;
      continue;
    }
    if (!part) {
      fail(where, `[[${topic}]] needs FULL or CALLBACK`);
      continue;
    }
    const kind = part.toLowerCase();
    if (block && block.topic !== topic) {
      fail(where, `${topic} block opened inside unclosed ${block.topic} block`);
      continue;
    }
    if (!block) {
      flushFixed();
      block = { topic, part: kind, full: [], callback: [], seen: new Set() };
    } else if (kind === "full" || block.seen.has(kind)) {
      fail(where, `${topic}: ${part} out of order (FULL must come first, each once)`);
    }
    block.part = kind;
    block.seen.add(kind);
  }
  if (block) fail(where, `${block.topic} block is not closed`);
  flushFixed();
  return segments;
}

const poiFiles = readdirSync(SRC_DIR).filter((f) => /^P\d{2}_.*\.md$/.test(f)).sort();
const pois = poiFiles.map((file) => {
  const md = read(file);
  const title = md.match(/^# (P\d{2}) — (.+)$/m);
  if (!title) {
    fail(file, 'first line must be "# Pnn — Name"');
    return null;
  }
  const [, id, name] = title;
  const where = `${file}`;
  const rows = tableRows(md.split(/\n## /)[0]);
  const cell = (key) => {
    const v = rows.get(key)?.[0];
    if (v === undefined) fail(where, `table row "${key}" missing`);
    return v ?? "";
  };

  if (cell("ID") !== id) fail(where, `table ID ${cell("ID")} does not match heading ${id}`);
  const [lat, lng] = cell("Koordinaten").match(/^([\d.]+),\s*([\d.]+)/)?.slice(1) ?? [];
  const radii = cell("Radius Kern / Anfahrt").match(/^(\d+) m \/ (\d+) m$/);
  if (!radii) fail(where, `cannot read radii "${cell("Radius Kern / Anfahrt")}"`);
  const introduces = parseTopicField(cell("Führt ein"), where);
  const callbacksTag = parseTopicField(cell("Ruft zurück"), where);
  const { flags, pickpockets } = parseFlags(cell("Flags"));
  const nearby = [...cell("Nahe POIs").matchAll(/(P\d{2})[^(,]*\((\d+) m\)/g)].map((m) => ({ id: m[1], meters: Number(m[2]) }));

  const s = sections(md, 2);
  const section = (prefix) => s.find((x) => x.heading.includes(prefix));
  const approachSection = section("ANFAHRT");
  const checkSection = section("STANDORT-CHECK");
  const coreSection = section("KERN");
  if (!approachSection) fail(where, "ANFAHRT section missing");
  if (!coreSection) fail(where, "KERN section missing");

  const core = coreSection ? parseCore(coreSection.body, id) : [];

  // Tags vs. blocks: "Führt ein" with a block ⇔ a FULL segment; callback-only blocks ⇔ "Ruft zurück".
  const fullTopics = core.filter((x) => x.kind === "full").map((x) => x.topicId);
  const callbackTopics = core.filter((x) => x.kind === "callback").map((x) => x.topicId);
  const callbackOnly = callbackTopics.filter((t) => !fullTopics.includes(t));
  const same = (a, b) => [...a].sort().join() === [...b].sort().join();
  if (!same(fullTopics, introduces.withBlock)) {
    fail(where, `"Führt ein" has blocks for [${introduces.withBlock}] but the text has FULL blocks for [${fullTopics}]`);
  }
  for (const t of fullTopics) {
    if (!callbackTopics.includes(t)) fail(where, `${t} has FULL but no CALLBACK`);
  }
  for (const t of introduces.fixedText) {
    if (callbackTopics.includes(t)) fail(where, `${t} is tagged "fester Text" but has a block`);
  }
  if (!same(callbackOnly, [...callbacksTag.withBlock, ...callbacksTag.fixedText])) {
    fail(where, `"Ruft zurück" lists [${[...callbacksTag.withBlock, ...callbacksTag.fixedText]}] but the text has callback-only blocks for [${callbackOnly}]`);
  }
  if (!groupOfPoi[id]) fail(where, `${id} has no theme group in 20_Verbindungen.md`);

  return {
    id,
    name,
    group: groupOfPoi[id] ?? "",
    position: { lat: parseNumber(lat, where), lng: parseNumber(lng, where) },
    radius: Number(radii?.[1]),
    approachRadius: Number(radii?.[2]),
    introduces: [...introduces.withBlock, ...introduces.fixedText],
    callbacks: callbackOnly,
    flags,
    pickpockets,
    nearby,
    approach: clip(spoken(approachSection?.body ?? ""), `${id}_approach`),
    ...(checkSection && { locationCheck: clip(spoken(checkSection.body), `${id}_check`) }),
    core,
  };
}).filter(Boolean);

for (const poi of pois) {
  for (const { id } of poi.nearby) if (!pois.some((p) => p.id === id)) fail(poi.id, `nearby POI ${id} does not exist`);
}

// --- README JSON vs. POI files --------------------------------------------------------------------

const readme = read("00_README.md");
const json = readme.match(/```json\n([\s\S]*?)```/)?.[1];
let readmePois = [];
try {
  readmePois = JSON.parse(json).pois;
} catch (e) {
  fail("00_README.md", `JSON block missing or invalid: ${e.message}`);
}
const usedKnownDifferences = new Set();
const compare = (poiId, field, a, b) => {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  const known = KNOWN_README_DIFFERENCES.find((d) => d.poi === poiId && d.field === field);
  if (known) usedKnownDifferences.add(known);
  else fail("00_README.md", `${poiId} ${field}: README JSON ${JSON.stringify(a)} ≠ POI file ${JSON.stringify(b)}`);
};
for (const r of readmePois) {
  const poi = pois.find((p) => p.id === r.id);
  if (!poi) {
    fail("00_README.md", `JSON lists ${r.id}, but there is no POI file`);
    continue;
  }
  compare(r.id, "position", { lat: r.lat, lng: r.lng }, poi.position);
  compare(r.id, "radius", r.r, poi.radius);
  compare(r.id, "approachRadius", r.rApproach, poi.approachRadius);
  compare(r.id, "introduces", [...r.introduces].sort(), [...poi.introduces].sort());
  compare(r.id, "callbacks", [...r.callbacks].sort(), [...poi.callbacks].sort());
  compare(r.id, "flags", [...r.flags].sort(), poi.flags);
}
for (const poi of pois) {
  if (!readmePois.some((r) => r.id === poi.id)) fail("00_README.md", `JSON is missing ${poi.id}`);
}
for (const d of KNOWN_README_DIFFERENCES) {
  if (!usedKnownDifferences.has(d)) fail("parse-barcelona-content.mjs", `known difference ${d.poi} ${d.field} is fixed — remove it from KNOWN_README_DIFFERENCES`);
}

// --- Output ---------------------------------------------------------------------------------------

if (errors.length > 0) {
  console.error(`Barcelona content has ${errors.length} problem(s):\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

const content = { audioBase: AUDIO_BASE, groups, pois, bridges, fillers, texts };
mkdirSync(new URL(".", OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  `// GENERATED by scripts/parse-barcelona-content.mjs from scripts/Barcelona/de/*.md — do not edit by hand.
// Change the markdown and run \`npm run content:barcelona\` instead.
import type { BarcelonaContent } from "./types";

export const barcelonaContent: BarcelonaContent = ${JSON.stringify(content, null, 2)};
`,
);

const segments = pois.reduce((n, p) => n + p.core.length + 1 + (p.locationCheck ? 1 : 0), 0);
console.log(
  `wrote src/tours/barcelona/content.ts: ${pois.length} POIs, ${segments} POI clips, ${bridges.length} bridges, ` +
    `${fillers.length} fillers, ${Object.keys(texts).length} intro/system texts; ${topicMentions} topic mentions checked against ${knownTopics.size} ids in 10_Topic_List.md`,
);
for (const d of KNOWN_README_DIFFERENCES) console.warn(`warning: accepted README difference ${d.poi} ${d.field} — ${d.why}`);
