import { useState, useRef } from "react";
import { MapPin, Search, LogOut } from "lucide-react";
import { MissionModal } from "./MissionModal";
import { AboutModal } from "./AboutModal";
import { TourCard } from "./TourCard";
import { supabase } from "../lib/supabase";
import { tours } from "../tours";
import { ORANGE, ORANGE_TINT } from "../theme";

const NEARBY_KM = 50;

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface LandingPageProps {
  onSelectTour: (tourId: string) => void;
}

export function LandingPage({ onSelectTour }: LandingPageProps) {
  const [search, setSearch] = useState("");
  const [missionOpen, setMissionOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [nearbyTourId, setNearbyTourId] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const searchLower = search.trim().toLowerCase();
  const visibleTours = tours.filter(
    (tour) => !searchLower || tour.searchTerms.some((term) => term.includes(searchLower)),
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false);
        const { latitude, longitude } = pos.coords;
        const nearest = tours
          .map((tour) => ({ tour, km: distanceKm(latitude, longitude, tour.center.lat, tour.center.lng) }))
          .sort((a, b) => a.km - b.km)[0];
        if (nearest && nearest.km <= NEARBY_KM) {
          setNearbyTourId(nearest.tour.id);
          cardRefs.current.get(nearest.tour.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
      () => setLocationLoading(false),
    );
  };

  return (
    <>
      <div className="min-h-screen bg-white font-sans overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-gray-900">Marco</span>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => setMissionOpen(true)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Our Mission
              </button>
              <button
                onClick={() => setAboutOpen(true)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
          <div
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase"
            style={{ backgroundColor: ORANGE_TINT, color: ORANGE }}
          >
            <MapPin className="w-3.5 h-3.5" />
            Audio-guided city tours
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Your Personal
            <br />
            <span style={{ color: ORANGE }}>City Guide</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
            Discover cities like a local — with Marco, your AI-powered audio guide who knows
            every story behind every corner.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden transition-all focus-within:border-orange-300">
              <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a city..."
                className="flex-1 py-3.5 px-3 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                onClick={handleUseLocation}
                disabled={locationLoading}
                className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-l border-gray-100 hover:bg-orange-50 transition-colors shrink-0 disabled:opacity-50"
                style={{ color: ORANGE }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {locationLoading ? "Locating…" : "Use my location"}
              </button>
            </div>
          </div>
        </section>

        {/* City Cards */}
        <section className="max-w-3xl mx-auto px-5 pb-20">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Available Tours
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleTours.map((tour) => (
              <TourCard
                key={tour.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(tour.id, el);
                  else cardRefs.current.delete(tour.id);
                }}
                tour={tour}
                highlighted={tour.id === nearbyTourId}
                onSelect={() => onSelectTour(tour.id)}
              />
            ))}
            {visibleTours.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tours found for "{search}"</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <MissionModal open={missionOpen} onClose={() => setMissionOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
