/**
 * Google Maps Distance Utilities for Compassionate Care
 * Supports Google Maps Geometry library (google.maps.geometry.spherical)
 * with robust mathematical Haversine fallback.
 */

export interface LatLngCoords {
  lat: number;
  lng: number;
}

const METERS_TO_MILES = 0.000621371;
const MILES_TO_METERS = 1609.344;
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculates great-circle distance between two points using Haversine formula.
 * Precision: accurate to 0.05 miles.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_MILES * c;
  return Number(distance.toFixed(1));
}

/**
 * Calculates distance in miles between two coordinates.
 * Utilizes Google Maps Spherical Geometry API when available in the browser window,
 * otherwise falls back to Haversine calculation.
 */
export function getDistanceMiles(origin: LatLngCoords, destination: LatLngCoords): number {
  if (!origin || !destination) return 0;

  if (
    typeof window !== 'undefined' &&
    window.google &&
    window.google.maps &&
    window.google.maps.geometry &&
    window.google.maps.geometry.spherical
  ) {
    try {
      const from = new window.google.maps.LatLng(origin.lat, origin.lng);
      const to = new window.google.maps.LatLng(destination.lat, destination.lng);
      const meters = window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
      return Number((meters * METERS_TO_MILES).toFixed(1));
    } catch {
      // Fall through to Haversine
    }
  }

  return calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
}

/**
 * Converts miles into meters for Google Maps Circle radius.
 */
export function milesToMeters(miles: number): number {
  return miles * MILES_TO_METERS;
}

/**
 * Checks if a companion location falls within the active senior's search radius.
 */
export function isWithinRadius(
  seniorCoords: LatLngCoords,
  companionCoords: LatLngCoords,
  radiusMiles: number
): boolean {
  const dist = getDistanceMiles(seniorCoords, companionCoords);
  return dist <= radiusMiles;
}

/**
 * Estimates driving and walking travel time in city traffic conditions.
 */
export function estimateTravelTime(
  distanceMiles: number,
  mode: 'driving' | 'walking' = 'driving'
): { minutes: number; text: string } {
  if (distanceMiles <= 0.1) {
    return { minutes: 2, text: '2 mins' };
  }

  if (mode === 'walking') {
    // Average 20 mins per mile
    const mins = Math.max(3, Math.round(distanceMiles * 18));
    return { minutes: mins, text: `${mins} min walk` };
  }

  // Driving in urban SF: ~20 mph + traffic stop buffer
  const mins = Math.max(4, Math.round(distanceMiles * 3.2 + 3));
  return { minutes: mins, text: `${mins} min drive` };
}

/**
 * Formats distance with unit for display.
 */
export function formatDistanceText(miles: number): string {
  if (miles < 0.2) return 'Less than 0.2 mi';
  return `${miles.toFixed(1)} mi`;
}
