import type { LatLng } from "../types";

/** One pre-recorded piece of speech: the text exactly as sent to ElevenLabs and its MP3. */
export interface Clip {
  text: string;
  audio: string;
}

/**
 * A piece of a POI's core text, in playing order. A topic block yields a "full" and a "callback" segment
 * next to each other (same slot number in the file name); a block that only calls back has no "full".
 */
export type CoreSegment =
  | ({ kind: "fixed" } & Clip)
  | ({ kind: "full" | "callback"; topicId: string } & Clip);

export interface BarcelonaPoi {
  id: string;
  name: string;
  /** Theme group from 20_Verbindungen.md (ROM, GOT, …); picks the bridge between two POIs. */
  group: string;
  position: LatLng;
  /** Core radius in meters. */
  radius: number;
  approachRadius: number;
  /** Topics this POI tells in full (with a block or as fixed text); registered as told after the core. */
  introduces: string[];
  /** Topics this POI only calls back to. */
  callbacks: string[];
  /** S = sensitive, V = fact with an expiry date. */
  flags: string[];
  /** Play S-SICHER-ALLG here (once per tour). */
  pickpockets: boolean;
  nearby: { id: string; meters: number }[];
  approach: Clip;
  /** Only played when another POI's approach radius overlaps (dynamic tour). */
  locationCheck?: Clip;
  core: CoreSegment[];
}

/** No `only`/`except` = any group. */
export interface GroupSet {
  only?: string[];
  except?: string[];
}

export interface Bridge extends Clip {
  id: string;
  from: GroupSet;
  to: GroupSet;
}

export interface Filler extends Clip {
  id: string;
  title: string;
  topics: string[];
  sensitive: boolean;
  /** Location-bound filler: plays when the user enters this circle. */
  trigger?: { position: LatLng; radius: number };
}

export interface BarcelonaContent {
  audioBase: string;
  groups: Record<string, string>;
  pois: BarcelonaPoi[];
  bridges: Bridge[];
  fillers: Filler[];
  /** MEET, INTRO, INTRO-WEIT, OUTRO and the system texts S-…. */
  texts: Record<string, Clip>;
}
