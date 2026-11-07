# Zurich City Tour – Pilot (12 POIs)

Pilot v1 · Tour ID `zurich-city-tour` · Guide: Peter · Language: English · Area: Altstadt on both banks of the Limmat (Bahnhofstrasse to Central, Quaibrücke to Seilergraben) · Stand 7 November 2026

Same concept and format as the Barcelona pilot: **start anywhere**, route assembled at runtime, topics told once (FULL first, CALLBACK afterwards). The files can go through the same parser as Barcelona. That's why the structural labels (`Koordinaten`, `Führt ein`, `🔊 ANFAHRT`, `📍 KERN` …) stay German, while all spoken text is English.

## Files

| File | Content |
|---|---|
| `00_README.md` | This file: structure, coordinates, JSON, respellings, decisions, facts to verify |
| `01_Peter_Intro_und_Systemtexte.md` | Persona, meet-Peter, start intro, far-away intro, outro, system texts |
| `10_Topic_List.md` | All topic IDs, baseline rules, fact-check and sources |
| `P01_…` to `P12_…` | One file per POI: coordinates, tags, approach, standort-check where needed, core with topic blocks |
| `20_Verbindungen.md` | 10 theme bridges, 6 fillers (F06 location-triggered), playback rules |
| `30_ClaudeCode_Prompts.md` | Prompts for Claude Code in VS Code |

## Script format (same as Barcelona)

- Topic blocks: `[[ID FULL]] … [[ID CALLBACK]] … [[/ID]]`. Topic not told yet → FULL, then register it. Already told → CALLBACK. CALLBACK without an earlier FULL → skip.
- Topics listed under "Führt ein" without a block (fixed text) are registered after the core finishes.
- Measured length (140 words/min): **73–89 s** with all FULL versions; **42–82 s** when a POI plays only callbacks.
- No directions in the scripts. The map shows the way.

## Coordinates & geofencing

*WGS84, estimated from my knowledge and public sources, **not surveyed**. Check in Mapbox/OSM and move each point to where you can see the object.*

| ID | Station | Lat | Lng | Radius core | Radius approach | Theme group | Nearby POIs (< 130 m) |
|---|---|---|---|---|---|---|---|
| P01 | Lindenhof | 47.373010 | 8.540720 | 30 m | 55 m | ROM | P02 Schipfe (106 m) |
| P02 | Schipfe | 47.372550 | 8.541950 | 20 m | 40 m | GASSE | P01 Lindenhof (106 m), P09 Rathaus (124 m) |
| P03 | St. Peter | 47.371390 | 8.540560 | 20 m | 45 m | KIRCHE | P04 Augustinergasse (80 m) |
| P04 | Augustinergasse | 47.371700 | 8.539600 | 20 m | 40 m | GASSE | P03 St. Peter (80 m) |
| P05 | Paradeplatz | 47.369700 | 8.538900 | 35 m | 60 m | GELD | – |
| P06 | Fraumünster & Münsterhof | 47.369860 | 8.541390 | 30 m | 55 m | KIRCHE | – |
| P07 | Bürkliplatz & Quaibrücke | 47.366600 | 8.541300 | 40 m | 70 m | MODERN | – |
| P08 | Grossmünster | 47.370100 | 8.543950 | 30 m | 55 m | KIRCHE | – |
| P09 | Rathaus & guildhouses | 47.371600 | 8.542800 | 25 m | 50 m | ZUNFT | P10 Cabaret Voltaire (115 m), P02 Schipfe (124 m, other bank) |
| P10 | Cabaret Voltaire & Spiegelgasse | 47.372200 | 8.544050 | 20 m | 40 m | DADA | P09 Rathaus (115 m) |
| P11 | Niederdorf | 47.373700 | 8.543900 | 30 m | 55 m | GASSE | – |
| P12 | Central & Polybahn | 47.376600 | 8.544000 | 35 m | 60 m | MODERN | – |

Close pairs: P03↔P04 (80 m), P01↔P02 (106 m), P09↔P10 (115 m). The stand-still rule applies there (core starts only after ~5 s nearly stationary inside the core radius). Note that P01 (hilltop) and P02 (riverside) are 106 m apart on the map but about 20 m apart in height, with stairs between them.

Max. distance between any two POIs: about 1.1 km (P07 ↔ P12), so every leg stays well under the 700 m limit.

## JSON (for the build)

```json
{
 "tourId": "zurich-city-tour",
 "guide": "peter",
 "language": "en",
 "mode": "dynamic",
 "pois": [
  {
   "id": "P01",
   "name": "Lindenhof",
   "lat": 47.37301,
   "lng": 8.54072,
   "r": 30,
   "rApproach": 55,
   "group": "ROM",
   "introduces": [
    "MED-04",
    "ROM-01"
   ],
   "callbacks": [],
   "flags": []
  },
  {
   "id": "P02",
   "name": "Schipfe",
   "lat": 47.37255,
   "lng": 8.54195,
   "r": 20,
   "rApproach": 40,
   "group": "GASSE",
   "introduces": [
    "REF-03",
    "REF-04"
   ],
   "callbacks": [
    "REF-01",
    "ROM-01"
   ],
   "flags": []
  },
  {
   "id": "P03",
   "name": "St. Peter",
   "lat": 47.37139,
   "lng": 8.54056,
   "r": 20,
   "rApproach": 45,
   "group": "KIRCHE",
   "introduces": [
    "MED-03",
    "SOC-06"
   ],
   "callbacks": [],
   "flags": []
  },
  {
   "id": "P04",
   "name": "Augustinergasse",
   "lat": 47.3717,
   "lng": 8.5396,
   "r": 20,
   "rApproach": 40,
   "group": "GASSE",
   "introduces": [
    "ARC-01"
   ],
   "callbacks": [
    "REF-01"
   ],
   "flags": []
  },
  {
   "id": "P05",
   "name": "Paradeplatz",
   "lat": 47.3697,
   "lng": 8.5389,
   "r": 35,
   "rApproach": 60,
   "group": "GELD",
   "introduces": [
    "C19-02",
    "ECO-01"
   ],
   "callbacks": [],
   "flags": [
    "V"
   ]
  },
  {
   "id": "P06",
   "name": "Fraumünster & Münsterhof",
   "lat": 47.36986,
   "lng": 8.54139,
   "r": 30,
   "rApproach": 55,
   "group": "KIRCHE",
   "introduces": [
    "ART-01",
    "MED-01"
   ],
   "callbacks": [
    "REF-01"
   ],
   "flags": [
    "V"
   ]
  },
  {
   "id": "P07",
   "name": "Bürkliplatz & Quaibrücke",
   "lat": 47.3666,
   "lng": 8.5413,
   "r": 40,
   "rApproach": 70,
   "group": "MODERN",
   "introduces": [
    "C19-01",
    "GEO-02"
   ],
   "callbacks": [
    "SOC-01"
   ],
   "flags": [
    "V"
   ]
  },
  {
   "id": "P08",
   "name": "Grossmünster",
   "lat": 47.3701,
   "lng": 8.54395,
   "r": 30,
   "rApproach": 55,
   "group": "KIRCHE",
   "introduces": [
    "MED-02",
    "REF-01"
   ],
   "callbacks": [],
   "flags": [
    "V"
   ]
  },
  {
   "id": "P09",
   "name": "Rathaus & guildhouses",
   "lat": 47.3716,
   "lng": 8.5428,
   "r": 25,
   "rApproach": 50,
   "group": "ZUNFT",
   "introduces": [
    "EMD-01",
    "MED-03",
    "SOC-01"
   ],
   "callbacks": [],
   "flags": []
  },
  {
   "id": "P10",
   "name": "Cabaret Voltaire & Spiegelgasse",
   "lat": 47.3722,
   "lng": 8.54405,
   "r": 20,
   "rApproach": 40,
   "group": "DADA",
   "introduces": [
    "ART-02",
    "C20-01"
   ],
   "callbacks": [],
   "flags": []
  },
  {
   "id": "P11",
   "name": "Niederdorf",
   "lat": 47.3737,
   "lng": 8.5439,
   "r": 30,
   "rApproach": 55,
   "group": "GASSE",
   "introduces": [
    "SOC-02",
    "SOC-03"
   ],
   "callbacks": [
    "ARC-01"
   ],
   "flags": []
  },
  {
   "id": "P12",
   "name": "Central & Polybahn",
   "lat": 47.3766,
   "lng": 8.544,
   "r": 35,
   "rApproach": 60,
   "group": "MODERN",
   "introduces": [
    "C19-03"
   ],
   "callbacks": [
    "C19-02",
    "ECO-01"
   ],
   "flags": [
    "V"
   ]
  }
 ]
}
```

## Respellings for the English voice (already in the spoken text)

*Untested. Most risky: Grohss-mewnster, Frow-mewnster, Zex-eh-loy-ten, Berk (Böögg), Tsew-ree-tewtsh, Ow-goos-tee-ner-gah-seh. Generate each once and listen.*

| Original | In the script |
|---|---|
| Grossmünster | Grohss-mewnster |
| Fraumünster | Frow-mewnster |
| Lindenhof | Linden-hohf |
| Turicum | Too-ree-kum |
| Schipfe | Shipf-eh |
| Augustinergasse | Ow-goos-tee-ner-gah-seh |
| Bahnhofstrasse | Bahn-hohf-shtrah-seh |
| Paradeplatz | Pa-rah-deh-plats |
| Sprüngli | Shprewng-lee |
| Luxemburgerli | Luxemburger-lee |
| Bürkliplatz | Bewrk-lee-plats |
| Quaibrücke | Kai-brew-keh |
| Rathaus | Raht-house |
| Sechseläuten | Zex-eh-loy-ten |
| Böögg | Berk |
| Niederdorf | Nee-der-dorf |
| Spiegelgasse | Shpee-gel-gah-seh |
| Zwingli | Tsving-lee |
| Central | Tsen-trahl |
| Polybahn | Polly-bahn |
| Grüezi | Grew-etsi |
| Züritüütsch | Tsew-ree-tewtsh |

Names left as written because an English voice usually handles them: Limmat, Felix Manz, Rudolf Brun, Hugo Ball, Emmy Hennings, Lenin, Chagall, Giacometti, Sigmar Polke, Karlsturm, Rösti, Hans Waldmann, Münsterbrücke, Kronenhalle. Test Karlsturm, Münsterbrücke and Kronenhalle too.

## Choices I made (please confirm)

1. **Tour ID:** you wrote `Zurich-City-Tour`. All existing IDs in the app are lowercase (`zurich`, `hamburg`), so I used **`zurich-city-tour`**. The display name stays "Zurich City Tour".
2. **Peter's age:** you wrote "30s"; I set **34**.
3. **Michelin restaurant:** Peter "worked in a Michelin-starred kitchen in Zurich". I didn't name a real restaurant on purpose.
4. **No S flags,** as you asked. I kept three minimal baseline rules (facts stated plainly, no jokes about victims, no personal opinion on current votes or parties in the Q&A). Delete them in `10_Topic_List.md` if you don't want them.
5. **Safety:** one light line at P11 (Niederdorf), since Zurich is very safe. I didn't find a specific police warning for the old town in this round; verify before recording.
6. **Overlap with the existing Altstadt tour:** both tours cover the same streets. You chose to keep both, so the app's landing page should make the difference clear (e.g. "Zurich City Tour · start anywhere · Peter").
7. **Simulator start:** Paradeplatz, 47.369700, 8.538900 (inside your area, on its western edge).
8. **Voice:** your ElevenLabs voice ID goes into the env variable `ELEVENLABS_VOICE_PETER`. A voice ID isn't a secret like an API key, but keep it out of the code anyway.

## To verify (fact-check by your team)

- P01: Roman base "from around 15 BC" (city source) vs customs post dated earlier on some tourism pages.
- P02: plaque location (opposite Schipfe 43); "his mother called to him" is tradition.
- P05: Credit Suisse founded 1856, later headquartered at Paradeplatz; UBS takeover 2023.
- P07: "about seventy percent of drinking water from the lake" (city/SRF figure); swimming season.
- P08: 187 steps of the Karlsturm; original Charlemagne statue in the crypt.
- P09: the Rathaus stands over the Limmat on two arches; who meets there today.
- P10: Lenin moved in 21 February 1916 (16 days after the cabaret opened), left 2 April 1917.
- P11: veal "Zürcher Geschnetzeltes" and Rösti as the local classic (uncontroversial, but check wording).
- P12: ride time of the Polybahn; Einstein's study years at ETH.
- Outro: Kronenhalle bar opening hours and the art on the walls.
