import { useEffect, useState } from "react";
import type { LatLng } from "../tours";

export interface UserLocation {
  position: LatLng | null;
  status: "locating" | "active" | "blocked";
}

/** Watches the device's real position while mounted; asks for permission on mount. */
export function useUserLocation(): UserLocation {
  const [location, setLocation] = useState<UserLocation>({ position: null, status: "locating" });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ position: null, status: "blocked" });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setLocation({ position: { lat: coords.latitude, lng: coords.longitude }, status: "active" });
      },
      (error) => {
        // Timeouts and lost signal are temporary: the watch keeps running and recovers by itself.
        if (error.code === error.PERMISSION_DENIED) setLocation({ position: null, status: "blocked" });
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return location;
}
