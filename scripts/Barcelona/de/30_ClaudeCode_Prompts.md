# Claude Code Prompts – Barcelona Dynamic Tour (Carlos)

Use these in Claude Code inside VS Code, **one phase at a time, in order**. Start each phase on a new branch, test it, merge, then continue. Do not paste them all at once.

**Before Phase 0:** Copy the whole `02-Barcelona` folder (including `10_Topic_List.md`) into the repo as `scripts/Barcelona/de/`. That matches where the Hamburg texts live (`scripts/Hamburg/de/`).

---

## Phase 0 — Read and plan (no code changes)

```
Read-only task. Do not change any files.

I want to add a new tour type to this app: a Barcelona tour that users can START FROM ANYWHERE, with a route assembled at runtime from a pool of POIs. The existing tours (zurich, hamburg, kitzingen, umea, stavanger) must keep working exactly as they do today.

The content is in scripts/Barcelona/de/ (German). Read all of it, starting with 00_README.md. It explains:
- 12 pilot POIs (P01–P12) with coordinates, core and approach radii, and topic tags
- topic blocks inside each POI script: [[TOPIC-ID FULL]] … [[TOPIC-ID CALLBACK]] … [[/TOPIC-ID]]. The app plays FULL the first time a topic comes up on a tour and CALLBACK afterwards ("told-once registry"). A CALLBACK without an earlier FULL is skipped.
- 01_Carlos_Intro_und_Systemtexte.md: guide intro, start intro, "far away" intro, outro, and short system texts (S-NAH, S-STEHEN, S-UNTERBRECHUNG, S-ABSCHWEIFEN, S-PAUSE, S-WEITER, S-SICHER-ALLG, S-QA-HINWEIS, S-KEIN-GPS)
- 10_Topic_List.md: the master list of topic IDs (ANT-, EMD-, C20-, POL-, ARC-, ART-, SOC-, GEO-) with S (sensitive) and V (verify) flags, and the sensitive-topic filter rules
- 20_Verbindungen.md: theme bridges (B01–B09) chosen by the theme groups of the previous and next POI, fillers (F01–F06), and the rules for when each plays

Then read the current code: src/tours/types.ts, src/tours/index.ts, src/tours/hamburg.ts, src/hooks/useTourEngine.ts, src/hooks/useUserLocation.ts, src/hooks/useAudioPlayer.ts, src/components/TourView.tsx, src/components/TourMap.tsx, src/components/AskGuide.tsx, supabase/functions/ask-marco/index.ts, and scripts/generate-hamburg-audio.mjs.

Note: today stops advance with the "Next Stop" button. GPS shows the user's position but does not trigger stops.

Write me a plan (no code) covering:
1. How to model a "dynamic tour" next to the existing Tour type without breaking existing tours (I expect a separate type and engine, sharing the audio player, map and AskGuide).
2. How to turn the markdown into data and audio: which text segments become separate MP3s (fixed parts, each FULL and CALLBACK block, approach, standort-check, bridges, fillers, system texts) and how the generate script should name them.
3. The runtime engine: route selection, GPS geofencing, the told-once registry, bridges and fillers, the close-POI and stand-still rules.
4. What needs Supabase changes (saved tour history per user) and what changes in ask-marco for the new guide.
5. Risks, especially iOS Safari stopping geolocation when the screen locks (this is a PWA), and GPS accuracy in narrow streets.
6. Anything in my content files that is ambiguous or contradictory.

Keep it concise. Ask me questions where you need a decision.
```

---

## Phase 1 — Content pipeline and audio

```
Implement phase 1 of the plan: content → data → audio. No runtime engine yet.

1. Write a parser script (Node, in scripts/) that reads scripts/Barcelona/de/*.md and produces src/tours/barcelona/content.ts (typed, generated, do not hand-edit). For each POI: id, name, lat/lng, core radius, approach radius, introduces[], callbacks[], flags, close POIs, theme group (from 20_Verbindungen.md), and an ordered list of segments. A segment is {kind: "fixed" | "full" | "callback", topicId?, text, audio}. Also extract approach, standort-check, intro texts, system texts, bridges with their from/to groups, and fillers (F05 with its trigger coordinate).
2. Also parse 10_Topic_List.md into src/tours/barcelona/topics.ts (id, title, description, flags).
3. Fail loudly if a file breaks the format, or if a POI uses a topic ID that is not in 10_Topic_List.md: unclosed block, FULL without CALLBACK where a callback is expected, topic tags in the table that don't match the blocks in the text, or the JSON in 00_README.md disagreeing with the files.
4. Extend audio generation: copy the approach of scripts/generate-hamburg-audio.mjs into scripts/generate-barcelona-audio.mjs, generating one MP3 per segment into public/audio/Barcelona/de/ with stable names (e.g. P04_core_02_C20-05_full.mp3). Speak the text exactly as written; the Catalan names are already respelled for TTS. Skip files that already exist unless --force is passed, so I don't pay twice. Use the voice ID from an env variable ELEVENLABS_VOICE_CARLOS; do not hardcode keys.
5. Add a --only flag so I can generate a single POI or a pronunciation test file first.

Show me the generated content.ts for P01 and P04 when done. Don't run the audio generation; I'll run it myself.
```

---

## Phase 2 — Dynamic engine with GPS triggering

```
Implement phase 2: the dynamic tour engine for Barcelona. Existing tours and their engine must not change behaviour.

Route selection (on tour start):
- Get the user's position. If no POI is within 800 m, play INTRO-WEIT, show the nearest POI on the map as the start point, and start the normal flow once the user is within 150 m of it.
- Otherwise build a route of up to 10 POIs (configurable): start at the nearest unvisited POI, then a greedy nearest-neighbour route improved with 2-opt. No leg may exceed 700 m (configurable). Skip POIs this user has already visited on earlier tours (phase 3 provides the history; for now use localStorage).
- Show the route on the map. Do not narrate directions.

Playback rules:
- Approach audio plays when the user enters a POI's approach radius.
- If the user is inside the approach radius of two POIs at once, play S-NAH, then that POI's standort-check.
- The core plays only when the user is inside the core radius AND has been nearly stationary (speed < 0.5 m/s, or position change < 5 m) for about 5 seconds. Before that, play S-STEHEN once.
- If the user leaves the core radius by more than 15 m during the core, pause and play S-UNTERBRECHUNG. Resume when they are back and stationary.
- Add a visible "Ich bin da" button that triggers the core manually (fallback for bad GPS). Show S-KEIN-GPS when accuracy is worse than 30 m for more than 20 seconds.
- Core segments: play fixed segments in order; for each topic block play FULL if the topic is not in the told-once registry, else CALLBACK; skip CALLBACK blocks whose topic was never told. Add topics from "introduces" to the registry after the core finishes.
- After a core: apply the bridge and filler rules from 20_Verbindungen.md exactly as written. F05 triggers once when entering 40 m of its coordinate.
- Play S-QA-HINWEIS once after the first POI and S-SICHER-ALLG once at P09. Play the outro after the last POI on the route.
- Keep the existing "Next Stop" button working as a manual override.

Dev tool for testing from home:
- Add a GPS simulator, only active with ?simulate=1 in the URL: start at a coordinate I pass as ?start=lat,lng, then walk along the generated route at 1.3 m/s with small random jitter, pausing 10 s at each core. Add a speed multiplier (?speed=5) and an on-screen log of geofence events and registry changes.

Write unit tests for route selection, the leg limit, the told-once registry, and bridge selection.
```

---

## Phase 3 — Wandering, pause/resume, tour history

```
Implement phase 3.

Wander detection:
- If the user is more than 150 m from the planned route corridor for more than 2 minutes (both configurable; ignore positions with accuracy worse than 30 m), play S-ABSCHWEIFEN and show a pop-up with two buttons: "Tour pausieren" and "Tour fortsetzen".
- Pause: play S-PAUSE, stop geofence triggers, keep the map open and keep showing the user's position.
- Continue (from the pop-up or a persistent "Fortsetzen" button while paused): play S-WEITER, recompute the route from the current position using only POIs not yet visited on this tour, and continue. The told-once registry is kept.

Tour history (Supabase):
- New table for completed and partial tours per user: user id, tour id, language, visited POI ids, topics told, started/ended timestamps. Add a migration with row-level security so users only see their own rows.
- On tour start, load the user's visited POIs for this city and exclude them from route selection, unless fewer than 4 unvisited POIs remain nearby; then allow repeats and say so in a toast.
- Replace the phase 2 localStorage history with this. Keep localStorage as an offline fallback.
```

---

## Phase 4 — Q&A with Carlos

```
Implement phase 4: Ask-the-guide for Barcelona.

1. In supabase/functions/ask-marco/index.ts add a "barcelona" entry. Persona: Carlos, 38, history teacher and wine expert, funny, loves history, wine, WWII and nightlife, was once a bullfighter and moved to Barcelona at 22. Answers in German, "du", short (2–4 sentences, it is read aloud), in character.
2. Send as context: the current or next POI (name plus its script text), the topics already told on this tour (with their titles and S flags from topics.ts), and the guide's style. When the user asks about an S-flagged topic, the sensitive-topic rules below apply with extra weight. The model should not repeat what the user has just heard; it should go deeper.
3. Add these rules to the system prompt for Barcelona:
   - Politically sensitive topics (Catalan independence, the 2017 referendum, Spain–Catalonia relations, the monarchy, the Civil War and Franco, 1714 and the Diada, bullfighting, colonialism and Columbus, overtourism): explain the main positions and attribute them ("supporters argue…, critics argue…"). Never take a side, never give a personal opinion, never recommend a party or a vote. If pressed, decline in character ("Ich bin Guide, kein Politiker…") and give the positions instead.
   - Settled historical facts are stated plainly. Balance applies to interpretations and current debates, not to whether events happened.
   - Recent events: say the information may be out of date. No speculation about ongoing court cases or politics.
   - No jokes about war, persecution or victims. Bullfighting: Carlos is self-ironic about his past, never promotes it.
   - Safety questions: practical, short, no stereotyping of neighbourhoods.
   - If unsure of a fact, say so.
4. Rename nothing else in ask-marco; just add the tour. Keep the function backwards compatible for the other tours.

Give me 10 test questions (including 3 political ones and one "what do you personally think about independence?") and the answers you expect, so I can test it.
```

---

## Notes

- **iOS:** As a PWA, the app will probably stop receiving GPS when the screen is locked. Test this first in Barcelona. The "Ich bin da" button is the fallback. A real fix needs a native wrapper (the deferred Expo/React Native step).
- **Coordinates:** Correct them in the markdown files (and the JSON in 00_README.md) and re-run the Phase 1 parser. Don't edit content.ts by hand.
- **Old file:** In the `02-Barcelona` folder, `01_Marco_Intro_und_Systemtexte.md` is outdated and can be deleted. The current version is `01_Carlos_Intro_und_Systemtexte.md`.
