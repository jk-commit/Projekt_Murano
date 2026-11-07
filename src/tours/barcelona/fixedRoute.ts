// Builds a fixed-order Barcelona tour from the generated content: picks FULL or CALLBACK per topic block
// from the order (told-once registry), and the bridge or filler for each leg by the rules in
// scripts/Barcelona/de/20_Verbindungen.md. The dynamic tour can reuse resolveCore and pickBridge as they are.
//
// Only type imports here, so `node scripts/print-barcelona-route.mjs` can run this file directly.
import type { LatLng, Stop } from "../types";
import type { BarcelonaContent, BarcelonaPoi, Bridge, Clip, GroupSet } from "./types";

/** "Weg länger als 150 m" — shorter legs without a bridge get no filler. */
export const FILLER_MIN_METERS = 150;

export type CoreChoice = { topicId: string; played: "full" | "callback" | "skipped" };

/**
 * The clips of a POI's core for a listener who has already heard `told`: FULL for a new topic,
 * CALLBACK for a told one, nothing for a callback-only block whose topic was never told.
 * `introduced` is what to add to the registry once the core has played (blocks and fixed text).
 */
export function resolveCore(poi: BarcelonaPoi, told: ReadonlySet<string>) {
  const clips: Clip[] = [];
  const choices: CoreChoice[] = [];
  for (const segment of poi.core) {
    if (segment.kind === "fixed") {
      clips.push(segment);
      continue;
    }
    const wanted = told.has(segment.topicId) ? "callback" : "full";
    const hasWanted = poi.core.some((s) => s.kind === wanted && s.topicId === segment.topicId);
    if (segment.kind === wanted) {
      clips.push(segment);
      choices.push({ topicId: segment.topicId, played: wanted });
    } else if (!hasWanted && segment.kind === "callback") {
      // Callback-only block, topic not told yet: skipped (counted once, on the callback segment).
      choices.push({ topicId: segment.topicId, played: "skipped" });
    }
  }
  return { clips, choices, introduced: poi.introduces };
}

const inGroupSet = (set: GroupSet, group: string) =>
  (!set.only || set.only.includes(group)) && !set.except?.includes(group);

/** The first bridge in table order that fits the two groups and hasn't played on this tour. */
export function pickBridge(bridges: Bridge[], fromGroup: string, toGroup: string, used: ReadonlySet<string>) {
  return bridges.find((b) => !used.has(b.id) && inGroupSet(b.from, fromGroup) && inGroupSet(b.to, toGroup));
}

export interface Leg {
  from: string;
  to: string;
  /** Walking distance; decides whether a filler plays and gives the walking time in the hint. */
  meters: number;
}

/** 4.5 km/h, a relaxed sightseeing pace. */
const WALKING_METERS_PER_MINUTE = 75;

export interface PlanEntry {
  stopId: string;
  name: string;
  clips: { file: string; note: string }[];
}

export interface FixedRouteOptions {
  legs: Leg[];
  /** The location-bound filler (F05) plays on this leg as its own walk stop at the trigger point. */
  locationFiller?: { id: string; from: string; to: string; name: string };
  /** Short German display names ("Kathedrale"); defaults to the POI name. */
  displayName?: (poi: BarcelonaPoi) => string;
}

const file = (clip: Clip) => clip.audio.split("/").pop() ?? clip.audio;

/** Stops and intro for a fixed tour in the order of `options.legs`, plus a readable plan for checking. */
export function buildFixedRoute(content: BarcelonaContent, options: FixedRouteOptions) {
  const { legs, locationFiller } = options;
  const order = [legs[0].from, ...legs.map((l) => l.to)];
  const poiById = new Map(content.pois.map((p) => [p.id, p]));
  const poi = (id: string) => {
    const p = poiById.get(id);
    if (!p) throw new Error(`Unknown POI ${id}`);
    return p;
  };
  const name = (p: BarcelonaPoi) => options.displayName?.(p) ?? p.name;
  const text = (id: string) => {
    const t = content.texts[id];
    if (!t) throw new Error(`Missing text ${id}`);
    return t;
  };
  for (let i = 1; i < legs.length; i++) {
    if (legs[i].from !== legs[i - 1].to) throw new Error(`Leg ${i} starts at ${legs[i].from}, not ${legs[i - 1].to}`);
  }
  if (new Set(order).size !== order.length) throw new Error("A POI appears twice in the route");

  const told = new Set<string>();
  const usedBridges = new Set<string>();
  const usedFillers = new Set<string>(locationFiller ? [locationFiller.id] : []);
  let warnedPickpockets = false;

  const stops: Stop[] = [];
  const plan: PlanEntry[] = [];
  const add = (stop: Stop, entries: { clip: Clip; note: string }[]) => {
    stops.push({ ...stop, audio: entries.map((e) => e.clip.audio) });
    plan.push({ stopId: stop.id, name: stop.name, clips: entries.map((e) => ({ file: file(e.clip), note: e.note })) });
  };
  const hint = (leg: Leg | undefined) =>
    leg && `Nächster Stopp: ${name(poi(leg.to))} · ~${Math.max(1, Math.round(leg.meters / WALKING_METERS_PER_MINUTE))} Min. zu Fuß`;

  const first = poi(order[0]);
  const intro = [
    { clip: text("INTRO"), note: "Start-Intro" },
    { clip: first.approach, note: `Anfahrt ${first.id}` },
  ];

  order.forEach((id, index) => {
    const p = poi(id);
    const leg = legs[index];
    const entries: { clip: Clip; note: string }[] = [];

    if (p.pickpockets && !warnedPickpockets) {
      warnedPickpockets = true;
      entries.push({ clip: text("S-SICHER-ALLG"), note: "Taschendiebe (einmal pro Tour)" });
    }
    const core = resolveCore(p, told);
    for (const clip of core.clips) {
      const segment = p.core.find((s) => s.audio === clip.audio)!;
      entries.push({ clip, note: segment.kind === "fixed" ? "fester Text" : `${segment.topicId} ${segment.kind.toUpperCase()}` });
    }
    const skipped = core.choices.filter((c) => c.played === "skipped").map((c) => c.topicId);
    core.introduced.forEach((t) => told.add(t));
    if (index === 0) entries.push({ clip: text("S-QA-HINWEIS"), note: "Q&A-Hinweis (einmal pro Tour)" });
    if (index === order.length - 1) entries.push({ clip: text("OUTRO"), note: "Outro" });

    add(
      { id: p.id, type: "poi", name: name(p), position: p.position, markerNumber: index + 1, audio: [], walkHint: hint(leg) },
      entries,
    );
    if (skipped.length > 0) plan[plan.length - 1].clips.push(...skipped.map((t) => ({ file: "—", note: `${t} CALLBACK übersprungen (noch nicht erzählt)` })));

    if (!leg) return;
    const next = poi(leg.to);
    const bridge = pickBridge(content.bridges, p.group, next.group, usedBridges);
    const walk: { clip: Clip; note: string }[] = [];
    if (bridge) {
      usedBridges.add(bridge.id);
      walk.push({ clip: bridge, note: `Brücke ${p.group} → ${next.group}` });
    } else if (leg.meters > FILLER_MIN_METERS) {
      const filler = content.fillers.find((f) => !usedFillers.has(f.id) && !f.trigger);
      if (filler) {
        usedFillers.add(filler.id);
        walk.push({ clip: filler, note: `Füller (${leg.meters} m, keine Brücke)` });
      }
    }
    const approach = { clip: next.approach, note: `Anfahrt ${next.id}` };
    const walkName = `Weg zu: ${name(next)}`;

    if (locationFiller && locationFiller.from === p.id && locationFiller.to === next.id) {
      const filler = content.fillers.find((f) => f.id === locationFiller.id);
      if (!filler?.trigger) throw new Error(`${locationFiller.id} is not a location-bound filler`);
      if (walk.length > 0) add({ id: `walk_${p.id}_${next.id}`, type: "walk", name: walkName, audio: [], walkHint: hint(leg) }, walk);
      add(
        {
          id: `walk_${p.id}_${locationFiller.id}`,
          type: "walk",
          name: locationFiller.name,
          position: filler.trigger.position,
          audio: [],
          walkHint: hint(leg),
        },
        [{ clip: filler, note: "Füller, ortsgebunden" }, approach],
      );
    } else {
      add({ id: `walk_${p.id}_${next.id}`, type: "walk", name: walkName, audio: [], walkHint: hint(leg) }, [...walk, approach]);
    }
  });

  const unusedBridges = content.bridges.filter((b) => !usedBridges.has(b.id)).map((b) => b.id);
  const unusedFillers = content.fillers.filter((f) => !usedFillers.has(f.id)).map((f) => f.id);
  return {
    intro: intro.map((e) => e.clip.audio),
    introPlan: intro.map((e) => ({ file: file(e.clip), note: e.note })),
    stops,
    plan,
    unusedBridges,
    unusedFillers,
    center: first.position as LatLng,
  };
}
