import { useState, lazy, Suspense } from "react";
import { LandingPage } from "./components/LandingPage";
import { TourStartScreen } from "./components/TourStartScreen";
import { AuthScreen } from "./components/AuthScreen";
import { useAuth } from "./hooks/useAuth";
import { getTour, tourLanguages } from "./tours";

// Loaded on demand so Mapbox is not part of the landing page bundle.
const TourView = lazy(async () => ({ default: (await import("./components/TourView")).TourView }));

type Screen =
  | { name: "landing" }
  | { name: "start"; tourId: string; language?: string }
  | { name: "tour"; tourId: string; language?: string };

function Splash({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center text-gray-400 text-sm">{text}</div>
  );
}

function MainApp() {
  const [screen, setScreen] = useState<Screen>({ name: "landing" });
  const goHome = () => setScreen({ name: "landing" });
  const tour = screen.name === "landing" ? undefined : getTour(screen.tourId, screen.language);

  if (!tour) {
    return <LandingPage onSelectTour={(tourId) => setScreen({ name: "start", tourId })} />;
  }

  const language = tour.language.code;

  if (screen.name === "start") {
    return (
      <TourStartScreen
        key={`${tour.id}-${language}`}
        tour={tour}
        languages={tourLanguages(tour.id)}
        onSelectLanguage={(code) => setScreen({ name: "start", tourId: tour.id, language: code })}
        onStart={() => setScreen({ name: "tour", tourId: tour.id, language })}
        onBack={goHome}
      />
    );
  }

  return (
    <Suspense fallback={<Splash text="Loading map…" />}>
      <TourView
        key={`${tour.id}-${language}`}
        tour={tour}
        onBack={() => setScreen({ name: "start", tourId: tour.id, language })}
        onBackToHome={goHome}
      />
    </Suspense>
  );
}

function App() {
  const { session, loading, recovery } = useAuth();

  if (loading) return <Splash text="Loading…" />;

  if (!session || recovery) {
    return <AuthScreen key={recovery ? "recovery" : "auth"} recovery={recovery} />;
  }

  return <MainApp />;
}

export default App;
