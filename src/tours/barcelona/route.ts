import type { FixedRouteOptions } from "../scripted/fixedRoute";
import type { ScriptedPoi } from "../scripted/types";

// The fixed walking order of the Barcelona pilot. Change the order here; FULL/CALLBACK, bridges and
// fillers follow from it (see fixedRoute.ts). Check the result with `npm run route:barcelona`.
//
// Walking distances: Mapbox Directions (walking), 07.11.2026, between the POI coordinates of the
// scripts. P01→P02 is set by hand (Mapbox snapped both points to the same street and gave 9 m; 53 m air line).
export const BARCELONA_ROUTE: FixedRouteOptions = {
  legs: [
    { from: "P01", to: "P02", meters: 60 },
    { from: "P02", to: "P03", meters: 158 },
    { from: "P03", to: "P07", meters: 150 },
    { from: "P07", to: "P08", meters: 124 },
    { from: "P08", to: "P06", meters: 240 },
    { from: "P06", to: "P04", meters: 369 },
    { from: "P04", to: "P05", meters: 83 },
    { from: "P05", to: "P09", meters: 392 },
    { from: "P09", to: "P10", meters: 840 },
    { from: "P10", to: "P11", meters: 215 },
    { from: "P11", to: "P12", meters: 282 },
  ],
  // F05 is location-bound; on this route the Via Laietana is crossed between Plaça Reial and Montcada.
  locationFiller: { id: "F05", from: "P09", to: "P10", name: "Via Laietana" },
  // "Kathedrale (Plaça de la Seu)" → "Kathedrale": the part in brackets is only for the scripts.
  displayName: (poi: ScriptedPoi) => poi.name.replace(/\s*\([^)]*\)\s*$/, ""),
  safetyText: "S-SICHER-ALLG",
  labels: {
    nextStop: (name, minutes) => `Nächster Stopp: ${name} · ~${minutes} Min. zu Fuß`,
    walkTo: (name) => `Weg zu: ${name}`,
  },
};
