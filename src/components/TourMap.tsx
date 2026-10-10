import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import type { LatLng, Tour } from "../tours";
import { ORANGE } from "../theme";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ROUTE_SOURCE = "tour-route";

type Coord = [number, number];

interface TourMapProps {
  tour: Tour;
  userPosition: LatLng;
}

function createMarkerElement(className: string, text?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = className;
  if (text) el.textContent = text;
  return el;
}

function lineFeature(coordinates: Coord[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: "Feature", geometry: { type: "LineString", coordinates }, properties: {} };
}

async function fetchWalkingRoute(coords: Coord[]): Promise<Coord[] | null> {
  const path = coords.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${path}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
  try {
    const data = await (await fetch(url)).json();
    return data.routes?.[0]?.geometry.coordinates ?? null;
  } catch {
    return null;
  }
}

/** The part of the route still ahead of the user. */
function remainingRoute(route: Coord[], position: LatLng): Coord[] {
  let nearest = 0;
  let minDist = Infinity;
  route.forEach(([lng, lat], i) => {
    const d = (lng - position.lng) ** 2 + (lat - position.lat) ** 2;
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  });
  return route.slice(nearest);
}

export function TourMap({ tour, userPosition }: TourMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeRef = useRef<Coord[]>([]);
  const positionRef = useRef(userPosition);
  const [mapError, setMapError] = useState<string | null>(null);

  positionRef.current = userPosition;

  const showRoute = (map: mapboxgl.Map) => {
    const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(lineFeature(remainingRoute(routeRef.current, positionRef.current)));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: mapboxgl.Map;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [tour.center.lng, tour.center.lat],
        zoom: 15,
        attributionControl: false,
      });
    } catch (err) {
      setMapError(`Init error: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true, customAttribution: "© OpenStreetMap contributors" }),
      "bottom-right",
    );

    map.on("error", (e) => {
      const msg = e.error?.message ?? "Unknown error";
      console.error("Mapbox error:", msg);
      setMapError(`Map error: ${msg}`);
    });

    map.on("load", () => {
      if (cancelled) return;
      mapRef.current = map;
      map.resize();

      const stopCoords: Coord[] = tour.stops
        .filter((s) => s.position)
        .map((s) => [s.position!.lng, s.position!.lat]);
      routeRef.current = stopCoords;

      map.addSource(ROUTE_SOURCE, { type: "geojson", data: lineFeature(stopCoords) });
      map.addLayer({
        id: `${ROUTE_SOURCE}-casing`,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.3 },
      });
      map.addLayer({
        id: `${ROUTE_SOURCE}-line`,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ORANGE, "line-width": 4, "line-opacity": 0.7 },
      });
      showRoute(map);

      // Replace the straight lines with the real walking route once it arrives.
      fetchWalkingRoute(stopCoords).then((route) => {
        if (!route || cancelled) return;
        routeRef.current = route;
        showRoute(map);
      });

      tour.stops.forEach((s) => {
        if (s.type !== "poi" || s.markerNumber == null || !s.position) return;
        new mapboxgl.Marker({ element: createMarkerElement("waypoint-number-marker", String(s.markerNumber)) })
          .setLngLat([s.position.lng, s.position.lat])
          .addTo(map);
      });

      userMarkerRef.current = new mapboxgl.Marker({ element: createMarkerElement("user-location-marker") })
        .setLngLat([positionRef.current.lng, positionRef.current.lat])
        .addTo(map);
    });

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, [tour]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userMarkerRef.current) return;
    userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    map.easeTo({ center: [userPosition.lng, userPosition.lat], duration: 1000 });
    showRoute(map);
  }, [userPosition]);

  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6 gap-3">
        <div className="text-red-600 font-bold text-base">Map failed to load</div>
        <div className="text-gray-700 text-sm text-center bg-white rounded-xl p-4 shadow max-w-xs break-words font-mono">
          {mapError}
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
