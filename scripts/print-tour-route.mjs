// Prints a scripted tour's fixed route as the app plays it: per stop the clips in order, with the FULL/CALLBACK
// choice, bridges, fillers and system texts. Run: npm run route:<tour>  (= node scripts/print-tour-route.mjs <tour id>)
// Uses the same code as the app (src/tours/scripted/fixedRoute.ts), run directly by Node's type stripping.

import { buildFixedRoute } from "../src/tours/scripted/fixedRoute.ts";
import { scriptedTour } from "./scripted-tours.mjs";

const tour = scriptedTour(process.argv[2]);
const { [tour.exportName]: content } = await import(tour.contentModule);
// route.ts exports one route (FixedRouteOptions): the export that has legs.
const routeOptions = Object.values(await import(tour.routeModule)).find((v) => v && Array.isArray(v.legs));
const route = buildFixedRoute(content, routeOptions);
const seconds = (file) => {
  const clip = [
    ...content.pois.flatMap((p) => [p.approach, ...p.core]),
    ...content.bridges,
    ...content.fillers,
    ...Object.values(content.texts),
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
