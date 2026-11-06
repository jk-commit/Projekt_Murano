import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UserLocation } from "../hooks/useUserLocation";
import type { LatLng, Stop, Tour } from "../tours";
import { ORANGE } from "../theme";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ROUTE_SOURCE = "tour-route";

type Coord = [number, number];

interface TourMapProps {
  tour: Tour;
  /** The tour's current place: the map centers on it and the route starts there. */
  focusPosition: LatLng;
  currentStopId: string | null;
  /** The device's real position, shown as the blue dot. */
  location: UserLocation;
  /** Called with the tapped stop, or null when the map itself is tapped. */
  onStopSelect: (stop: Stop | null) => void;
  onToast: (message: string) => void;
}

function createStopMarkerElement(stop: Stop): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "waypoint-number-marker";
  el.textContent = String(stop.markerNumber);
  el.setAttribute("aria-label", `Stop ${stop.markerNumber}: ${stop.name}`);
  return el;
}

function createUserMarkerElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "user-location-marker";
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

export function TourMap({ tour, focusPosition, currentStopId, location, onStopSelect, onToast }: TourMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const stopMarkersRef = useRef<Map<string, HTMLElement>>(new Map());
  const routeRef = useRef<Coord[]>([]);
  const focusRef = useRef(focusPosition);
  const currentStopIdRef = useRef(currentStopId);
  const userPositionRef = useRef(location.position);
  const onStopSelectRef = useRef(onStopSelect);
  const [mapError, setMapError] = useState<string | null>(null);

  focusRef.current = focusPosition;
  currentStopIdRef.current = currentStopId;
  userPositionRef.current = location.position;
  onStopSelectRef.current = onStopSelect;

  const showRoute = (map: mapboxgl.Map) => {
    const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(lineFeature(remainingRoute(routeRef.current, focusRef.current)));
  };

  const showUserLocation = (map: mapboxgl.Map) => {
    const position = userPositionRef.current;
    if (!position) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({ element: createUserMarkerElement() })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
    }
    userMarkerRef.current.setLngLat([position.lng, position.lat]);
  };

  const highlightCurrentStop = () => {
    stopMarkersRef.current.forEach((el, stopId) => {
      el.classList.toggle("is-current", stopId === currentStopIdRef.current);
    });
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

    map.on("click", () => onStopSelectRef.current(null));

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
        const el = createStopMarkerElement(s);
        el.addEventListener("click", (e) => {
          // Otherwise the map sees this tap too, and its click handler would close the selection.
          e.stopPropagation();
          onStopSelectRef.current(s);
        });
        stopMarkersRef.current.set(s.id, el);
        new mapboxgl.Marker({ element: el }).setLngLat([s.position.lng, s.position.lat]).addTo(map);
      });
      highlightCurrentStop();

      showUserLocation(map);
    });

    const stopMarkers = stopMarkersRef.current;
    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      stopMarkers.clear();
    };
  }, [tour]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [focusPosition.lng, focusPosition.lat], duration: 1000 });
    showRoute(map);
  }, [focusPosition]);

  // Only moves the dot, not the map: the view must not jump while someone is looking around.
  useEffect(() => {
    if (mapRef.current) showUserLocation(mapRef.current);
  }, [location.position]);

  useEffect(highlightCurrentStop, [currentStopId]);

  const centerOnUser = () => {
    if (location.status === "blocked") {
      onToast("Location is blocked. Allow it in your browser settings.");
    } else if (!location.position) {
      onToast("Looking for your location…");
    } else {
      mapRef.current?.easeTo({ center: [location.position.lng, location.position.lat], duration: 1000 });
    }
  };

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

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <button
        type="button"
        onClick={centerOnUser}
        className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center bg-white text-gray-700 rounded-full shadow-lg transition-all hover:bg-gray-50 active:scale-90"
        aria-label="Center on my location"
      >
        <LocateFixed className="w-5 h-5" />
      </button>
    </div>
  );
}
