// Tours built from markdown scripts (Barcelona format: POI files with [[ID FULL]] / [[ID CALLBACK]] blocks,
// bridges and fillers in 20_Verbindungen.md, topics in 10_Topic_List.md). Shared by
//   scripts/parse-tour-content.mjs   markdown → src/tours/<dir>/content.ts
//   scripts/print-tour-route.mjs     the fixed route as the app plays it
//   scripts/generate-tour-audio.mjs  one MP3 per clip with ElevenLabs
// The key is the tour id the app uses (src/tours/<dir>/tour.ts, ask-marco).

export const SCRIPTED_TOURS = {
  barcelona: {
    folder: "Barcelona",
    lang: "de",
    dir: "barcelona",
    exportName: "barcelonaContent",
    requiredTexts: ["MEET", "INTRO", "INTRO-WEIT", "OUTRO", "S-NAH", "S-STEHEN", "S-QA-HINWEIS", "S-SICHER-ALLG"],
    // Heading (start) of the README section with the respelling table; its "Im Skript" column is the pronunciation test.
    respellingsHeading: "Aussprache-Ersetzungen",
    // Differences between the README JSON and the POI files that are known and accepted for now. Fix them in the
    // markdown, then remove the entry here — an entry that no longer matches is an error too.
    knownReadmeDifferences: [
      { poi: "P01", field: "flags", why: "Table has V (Brossa letters, frieze date), README JSON has no flag" },
    ],
    // Voice chosen for Carlos on 07.11.2026; ELEVENLABS_VOICE_CARLOS overrides it.
    voice: { env: "ELEVENLABS_VOICE_CARLOS", fallback: "hQsBZyP1VzBdsHrgFT7M" },
    // Words the voice still mispronounces, replaced only on the way to ElevenLabs (the markdown stays as it is),
    // e.g. ["Kalj", "Kallj"]. Changing this marks the affected files as stale (regenerate with --changed).
    pronunciation: [],
  },
  "zurich-city-tour": {
    folder: "Zurich-City",
    lang: "en",
    dir: "zurich-city-tour",
    exportName: "zurichCityContent",
    requiredTexts: ["MEET", "INTRO", "INTRO-WEIT", "OUTRO", "S-NAH", "S-STEHEN", "S-QA-HINWEIS", "S-SICHER"],
    respellingsHeading: "Respellings",
    knownReadmeDifferences: [],
    // Voice chosen for Peter on 07.11.2026; ELEVENLABS_VOICE_PETER overrides it.
    voice: { env: "ELEVENLABS_VOICE_PETER", fallback: "15CVCzDByBinCIoCblXo" },
    pronunciation: [],
  },
};

export function scriptedTour(id) {
  const tour = SCRIPTED_TOURS[id];
  if (!tour) {
    console.error(`Unknown tour "${id ?? ""}". Known: ${Object.keys(SCRIPTED_TOURS).join(", ")}`);
    process.exit(1);
  }
  return {
    id,
    ...tour,
    srcDir: new URL(`./${tour.folder}/${tour.lang}/`, import.meta.url),
    contentFile: new URL(`../src/tours/${tour.dir}/content.ts`, import.meta.url),
    contentModule: `../src/tours/${tour.dir}/content.ts`,
    routeModule: `../src/tours/${tour.dir}/route.ts`,
    audioBase: `/audio/${tour.folder}/${tour.lang}`,
    audioDir: new URL(`../public/audio/${tour.folder}/${tour.lang}/`, import.meta.url),
    manifestFile: new URL(`./${tour.folder}/audio-manifest.json`, import.meta.url),
    testFile: new URL(`./${tour.folder}/pronunciation_test.mp3`, import.meta.url),
  };
}
