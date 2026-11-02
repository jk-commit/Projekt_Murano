import type { Tour } from "./types";
import { zurich } from "./zurich";
import { kitzingen } from "./kitzingen";
import { umea } from "./umea";
import { umeaDe } from "./umea.de";

export type { Tour, Stop, LatLng } from "./types";

/**
 * All tours, in the order they appear on the landing page. To add a city, add its file here.
 * Each entry lists the language variants of one tour (same id); the first is the default.
 */
const tourVariants: Tour[][] = [[zurich], [kitzingen], [umea, umeaDe]];

export const tours: Tour[] = tourVariants.map((variants) => variants[0]);

export function tourLanguages(id: string): Tour[] {
  return tourVariants.find((variants) => variants[0].id === id) ?? [];
}

export function getTour(id: string, languageCode?: string): Tour | undefined {
  const variants = tourLanguages(id);
  return variants.find((t) => t.language.code === languageCode) ?? variants[0];
}

export function poiStops(tour: Tour) {
  return tour.stops.filter((s) => s.type === "poi");
}
