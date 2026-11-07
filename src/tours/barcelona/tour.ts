import type { Tour } from "../types";
import { barcelonaContent } from "./content";
import { buildFixedRoute } from "./fixedRoute";
import { BARCELONA_ROUTE } from "./route";

// German only, fixed order (pilot v1). The texts are scripts/Barcelona/de/*.md, turned into content.ts by
// scripts/parse-barcelona-content.mjs; the MP3s (one per segment) come from scripts/generate-barcelona-audio.mjs.
// GPS does not trigger anything yet: the user moves on with "Next Stop", as in the other tours. Every leg is a
// walk stop with the bridge or filler for that leg and the next POI's approach text.
const route = buildFixedRoute(barcelonaContent, BARCELONA_ROUTE);

export const barcelona: Tour = {
  id: "barcelona",
  title: "Barcelona Altstadt-Tour",
  shortTitle: "Barcelona Altstadt",
  region: "Barcelona, Spanien",
  description:
    "Entdecke Barcelonas Altstadt mit Carlos, Geschichtslehrer und Weinkenner — 12 Stopps vom Römertor an der Plaça Nova über Kathedrale, El Call und Plaça Reial bis Santa Maria del Mar und zum Born.",
  duration: "~1,5 Stunden",
  language: { code: "de", label: "Deutsch", flag: "🇩🇪" },
  heroImage: "/Barcelona.jpg",
  heroCredit: "© trolvag / CC BY-SA 3.0",
  searchTerms: [
    "barcelona",
    "barri gòtic",
    "barri gotic",
    "gotisches viertel",
    "el born",
    "katalonien",
    "catalonia",
    "spanien",
    "spain",
    "picasso",
    "gaudí",
    "gaudi",
  ],
  center: route.center,
  intro: { label: "Willkommen in Barcelona", audio: route.intro },
  guide: { name: "Carlos", introAudio: barcelonaContent.texts.MEET.audio, askEnabled: true },
  // Segments of one stop follow each other like paragraphs, not like separate tracks.
  trackGapSeconds: 0.7,
  completeText: "Du hast zwei Jahrtausende Barcelona entdeckt",
  shareText: "Ich habe gerade Barcelonas Altstadt mit meinem persönlichen KI-Stadtführer entdeckt. 🎧🗺️",
  stops: route.stops,
};
