import type { Tour } from "../types";
import { zurichCityContent } from "./content";
import { buildFixedRoute } from "../scripted/fixedRoute";
import { ZURICH_CITY_ROUTE } from "./route";

// English only, fixed order (pilot v1), same pipeline as Barcelona. The texts are scripts/Zurich-City/en/*.md,
// turned into content.ts by scripts/parse-tour-content.mjs; the MP3s (one per segment) come from
// scripts/generate-tour-audio.mjs. A separate tour from the Zurich Altstadt tour with Marco (src/tours/zurich.ts).
// GPS does not trigger anything yet: the user moves on with "Next Stop". Every leg is a walk stop with the bridge
// or filler for that leg and the next POI's approach text.
const route = buildFixedRoute(zurichCityContent, ZURICH_CITY_ROUTE);

export const zurichCity: Tour = {
  id: "zurich-city-tour",
  title: "Zurich City Tour",
  shortTitle: "Zurich City Tour",
  region: "Zürich, Schweiz",
  description:
    "Two thousand years of Zurich with Peter, a Basel-born chef turned guide — 12 stops on both banks of the Limmat, from Central via Grossmünster, Lindenhof and Paradeplatz to the lake. Romans, reformers, bankers, Dada and the best things to eat on the way.",
  duration: "~1.5 hours",
  language: { code: "en", label: "English", flag: "🇬🇧" },
  heroImage: "/Zurich-City.jpg",
  heroCredit: "© CEphoto, Uwe Aranas / CC BY-SA 3.0",
  searchTerms: [
    "zurich",
    "zürich",
    "city tour",
    "old town",
    "altstadt",
    "limmat",
    "grossmünster",
    "fraumünster",
    "lindenhof",
    "switzerland",
    "schweiz",
  ],
  center: route.center,
  intro: { label: "Welcome to Zurich", audio: route.intro },
  guide: { name: "Peter", introAudio: zurichCityContent.texts.MEET.audio, askEnabled: true },
  // Segments of one stop follow each other like paragraphs, not like separate tracks.
  trackGapSeconds: 0.7,
  completeText: "You've walked through two thousand years of Zurich",
  shareText: "I just explored Zurich with my personal AI city guide. 🎧🗺️",
  stops: route.stops,
};
