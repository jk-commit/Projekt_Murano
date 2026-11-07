import type { FixedRouteOptions } from "../scripted/fixedRoute";
import type { ScriptedPoi } from "../scripted/types";

// The fixed walking order of the Zurich City Tour pilot: the shortest open route through all 12 POIs (exact
// search over Mapbox walking distances, 07.11.2026). It starts at Central, a few minutes from the main station,
// and ends at the lake, across the Quaibrücke from the Kronenhalle of the outro tip. Grossmünster (Reformation)
// comes before Schipfe, Augustinergasse and Fraumünster, whose callbacks build on it.
// Change the order here; FULL/CALLBACK, bridges and fillers follow from it. Check with `npm run route:zurich-city-tour`.
//
// Walking distances: Mapbox Directions (walking) between the POI coordinates of the scripts. P06→P07 includes
// the detour onto the Münsterbrücke for F06 (432 m direct).
export const ZURICH_CITY_ROUTE: FixedRouteOptions = {
  legs: [
    { from: "P12", to: "P11", meters: 343 },
    { from: "P11", to: "P10", meters: 218 },
    { from: "P10", to: "P08", meters: 325 },
    { from: "P08", to: "P09", meters: 278 },
    { from: "P09", to: "P02", meters: 171 },
    { from: "P02", to: "P01", meters: 196 },
    { from: "P01", to: "P03", meters: 219 },
    { from: "P03", to: "P04", meters: 117 },
    { from: "P04", to: "P05", meters: 298 },
    { from: "P05", to: "P06", meters: 221 },
    { from: "P06", to: "P07", meters: 565 },
  ],
  // F06 is location-bound (Münsterbrücke); no leg crosses that bridge, so the walk from the Fraumünster to the
  // lake takes a short detour onto it. The walk stop sits on the bridge, so the map route goes over it too.
  locationFiller: { id: "F06", from: "P06", to: "P07", name: "Münsterbrücke" },
  // "Niederdorf (Hirschenplatz)" → "Niederdorf": the part in brackets is only for the scripts.
  displayName: (poi: ScriptedPoi) => poi.name.replace(/\s*\([^)]*\)\s*$/, ""),
  safetyText: "S-SICHER",
  labels: {
    nextStop: (name, minutes) => `Next stop: ${name} · ~${minutes} min walk`,
    walkTo: (name) => `Walk to ${name}`,
  },
};
