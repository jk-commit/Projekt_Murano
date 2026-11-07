# Claude Code prompts – Zurich City Tour (Peter)

Run them in Claude Code inside VS Code, **one at a time, in order**, each on its own branch. Test, merge, then continue.

**Before prompt 1:** copy the whole `03-Zurich` folder into the repo as `scripts/Zurich-City/en/`. Set the env variable `ELEVENLABS_VOICE_PETER` to Peter's voice ID (locally and in Netlify/Supabase where the audio script and the Q&A run).

**How this fits with Barcelona:** Zurich City Tour uses the same format and the same start-anywhere engine. Whatever Claude Code builds for Barcelona (parser, audio script, dynamic engine) should be reused here, not copied. Prompt 1 makes that explicit.

---

## Prompt 1 — Content pipeline (reuse Barcelona's)

```
Add a second content set to the tour pipeline: the "Zurich City Tour" (tour id: zurich-city-tour), English, guide Peter.

The content is in scripts/Zurich-City/en/. Read 00_README.md first. It uses exactly the same format as scripts/Barcelona/de/ (same section markers, same table fields, same [[ID FULL]] / [[ID CALLBACK]] / [[/ID]] blocks, same bridge/filler rules in 20_Verbindungen.md, topic IDs in 10_Topic_List.md). The structural labels are German on purpose so the same parser works; the spoken text is English.

1. Generalise the Barcelona parser and audio generation so they take a tour folder and language as input (scripts/<Tour>/<lang>/) instead of being hard-coded to Barcelona. Don't copy-paste them. Barcelona must keep producing identical output: run it before and after and diff the generated files.
2. Generate src/tours/zurich-city-tour/content.ts and topics.ts with the generalised parser. Validate all topic IDs against 10_Topic_List.md and all tags in the POI tables against the blocks, and fail loudly on mismatches.
3. Audio: one MP3 per segment into public/audio/Zurich-City/en/, stable names, skip existing files unless --force, voice from ELEVENLABS_VOICE_PETER. Add --only so I can generate a pronunciation test first (the respelled words listed in 00_README.md).
4. Don't run the audio generation. Show me the generated content for P02 and P09 and the list of segments that would be generated, with an estimated character count for ElevenLabs.
```

---

## Prompt 2 — Start-anywhere engine for Zurich

```
Register zurich-city-tour as a dynamic (start-anywhere) tour.

If the dynamic engine from the Barcelona work already exists (route selection, GPS geofencing with approach and core radii, stand-still rule, told-once registry, bridges and fillers, wander detection with pause/continue, tour history in Supabase, GPS simulator), reuse it. Zurich only needs its content and settings.

If it doesn't exist yet, build it now as a generic engine for any dynamic tour, following phases 2 and 3 in scripts/Barcelona/de/30_ClaudeCode_Prompts.md, and wire both Barcelona and Zurich to it. Existing fixed tours (zurich, hamburg, kitzingen, umea, stavanger) must not change behaviour.

Zurich settings:
- Max. 10 stops per route, max. 700 m per leg (all Zurich POIs are within 1.1 km of each other).
- Start: nearest unvisited POI if within 800 m, otherwise INTRO-WEIT and guide the user to the nearest POI.
- Play S-QA-HINWEIS once after the first POI, S-SICHER once at P11, the outro after the last POI.
- F06 triggers once within 30 m of its coordinate (Münsterbrücke).
- Note in the README: P01 (hilltop) and P02 (riverside) are 106 m apart but at different heights with stairs. Use walking distance from Mapbox Directions for route legs if available, not straight-line distance.
- Landing page card: "Zurich City Tour", region "Zürich, Schweiz", description in English mentioning "start anywhere" and Peter, so it's clearly different from the existing Zurich Altstadt tour.

Simulator test: ?simulate=1&start=47.369700,8.538900 (Paradeplatz). Show me the generated route, the bridges and fillers chosen, and which topics played FULL vs CALLBACK.
```

---

## Prompt 3 — Ask Peter (Q&A)

```
Add Peter to supabase/functions/ask-marco/index.ts for the tour id zurich-city-tour. Keep the function backwards compatible for all other tours.

Persona: Peter, 34, tour guide, grew up in Basel and moved to Zurich, worked for years in a Michelin-starred kitchen in Zurich, happy and positive, loves cooking, art and history. Answers in English, short (2–4 sentences, it is read aloud), warm and in character. Friendly Basel-vs-Zurich teasing is fine.

Context to send: the current or next POI (name and script text), the topics already told on this tour (titles from topics.ts), so Peter goes deeper instead of repeating.

Rules for the system prompt:
- State historical facts plainly, including dark ones (e.g. the drowning of Felix Manz, the execution of Hans Waldmann). No jokes about victims.
- No personal opinion on current votes, parties or politicians. He can explain what is being debated and the main arguments.
- For current facts (banks, companies, opening hours, events) say they may have changed.
- Food and drink recommendations: describe types of places and dishes; name specific restaurants or bars only if they are in the tour content (e.g. Sprüngli, Kronenhalle), and add that opening hours may change.
- If unsure, say so.

Give me 10 test questions with the answers you expect, including: one on Zwingli, one on Swiss banking, one asking Peter's opinion on a current Swiss vote, one food question, and one "Is Basel better than Zurich?".
```

---

## Notes

- **iOS:** as a PWA the app probably stops receiving GPS when the screen locks. The "I'm here" button is the fallback. Test early.
- **Coordinates:** correct them in the markdown (and the JSON in 00_README.md), then re-run the parser. Never edit generated files by hand.
- **Costs:** the pronunciation test (prompt 1, `--only`) costs a few cents. Generate the full set only after you've listened to it.
