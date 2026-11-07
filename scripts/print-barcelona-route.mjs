// Prints the fixed Barcelona route as the app plays it: per stop the clips in order, with the FULL/CALLBACK
// choice, bridges, fillers and system texts. Run: npm run route:barcelona
// Uses the same code as the app (src/tours/barcelona/fixedRoute.ts), run directly by Node's type stripping.

import { barcelonaContent } from "../src/tours/barcelona/content.ts";
import { buildFixedRoute } from "../src/tours/barcelona/fixedRoute.ts";
import { BARCELONA_ROUTE } from "../src/tours/barcelona/route.ts";

const route = buildFixedRoute(barcelonaContent, BARCELONA_ROUTE);
const seconds = (file) => {
  const clip = [
    ...barcelonaContent.pois.flatMap((p) => [p.approach, ...p.core]),
    ...barcelonaContent.bridges,
    ...barcelonaContent.fillers,
    ...Object.values(barcelonaContent.texts),
  ].find((c) => c.audio.endsWith(`/${file}`));
  // 140 words per minute, as in the scripts.
  return clip ? Math.round((clip.text.split(/\s+/).length / 140) * 60) : 0;
};

const print = (title, clips, hint) => {
  const total = clips.reduce((n, c) => n + seconds(c.file), 0);
  console.log(`\n${title}  (~${total} s)${hint ? `  · ${hint}` : ""}`);
  for (const c of clips) console.log(`   ${c.file.padEnd(34)} ${c.note}`);
};

const stopById = new Map(route.stops.map((s) => [s.id, s]));
print("INTRO (beim Öffnen der Tour)", route.introPlan);
for (const entry of route.plan) {
  const stop = stopById.get(entry.stopId);
  const label = stop.type === "poi" ? `${stop.markerNumber}. ${entry.stopId} ${entry.name}` : `   ${entry.name}`;
  print(label, entry.clips, stop.walkHint);
}
console.log(`\nNicht gespielt: Brücken ${route.unusedBridges.join(", ") || "–"}; Füller ${route.unusedFillers.join(", ") || "–"}`);
