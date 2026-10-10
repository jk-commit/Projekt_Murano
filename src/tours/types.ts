export interface LatLng {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  type: "poi" | "walk";
  name: string;
  /** Missing for stops without a fixed location — the user position then stays where it was. */
  position?: LatLng;
  /** Number shown on the map marker (POIs only). */
  markerNumber?: number;
  audio: string[];
  /** Shown in the audio drawer while this stop's audio plays, e.g. "~3 min walk to …". */
  walkHint?: string;
  /** Plays automatically after another stop's audio has finished, instead of on "Next Stop". */
  trigger?: { type: "timer"; afterStopId: string; delaySeconds: number };
}

export interface Tour {
  /** Must match a key of TOURS in supabase/functions/ask-marco/index.ts. */
  id: string;
  /** "Zurich Altstadt Tour" — top bars. */
  title: string;
  /** "Zurich Altstadt" — cards and hero headline. */
  shortTitle: string;
  /** "Zurich, Switzerland" — image badge. */
  region: string;
  description: string;
  duration: string;
  language: { label: string; flag: string };
  heroImage: string;
  heroCredit?: string;
  /** Lowercase terms the landing page search matches against. */
  searchTerms: string[];
  /** Map center and the user's starting position. */
  center: LatLng;
  intro: { label: string; audio: string[] };
  guide: { name: string; introAudio: string; askEnabled: boolean };
  stops: Stop[];
  /** "You've explored …" on the tour-complete screen. */
  completeText: string;
  shareText: string;
}
