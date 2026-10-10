import type { Tour } from "./types";
import { zurich } from "./zurich";
import { kitzingen } from "./kitzingen";
import { umea } from "./umea";

export type { Tour, Stop, LatLng } from "./types";

/** All tours, in the order they appear on the landing page. To add a city, add its file here. */
export const tours: Tour[] = [zurich, kitzingen, umea];

export function getTour(id: string): Tour | undefined {
  return tours.find((t) => t.id === id);
}

export function poiStops(tour: Tour) {
  return tour.stops.filter((s) => s.type === "poi");
}
