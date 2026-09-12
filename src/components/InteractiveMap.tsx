import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Circle,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import { Companion, SeniorProfile } from '../types';
import {
  Navigation,
  Star,
  ShieldCheck,
  HeartHandshake,
  Calendar,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  MapPin,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { milesToMeters, formatDistanceText, estimateTravelTime } from '../utils/distanceUtils';

interface InteractiveMapProps {
  companions: Companion[];
  selectedCompanion: Companion | null;
  activeSenior: SeniorProfile;
  maxDistance: number;
  onSelectCompanion: (companion: Companion) => void;
  onBookCompanion: (companion: Companion) => void;
  onRadiusChange?: (newRadius: number) => void;
  viewMode?: 'both' | 'map' | 'list';
}

/**
 * Custom Google Maps styling palette mirroring Compassionate Care's warm,
 * soothing sage and mint aesthetic.
 */
const compassionateCareMapStyle: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f4f7f4' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#cbe5f4' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6e95a8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#d5ebd9' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4d7756' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d8e4dc' }, { weight: 1 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cad8cf' }, { weight: 1.5 }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e5eee7' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#688574' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2d533d' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#edf2ee' }],
  },
];

/**
 * Controller hook component to handle pan and zoom reactions inside Google Maps
 */
const MapEffectController: React.FC<{
  center: { lat: number; lng: number };
  selectedCompanion: Companion | null;
}> = ({ center, selectedCompanion }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedCompanion) {
      // Pan smoothly toward selected companion while keeping senior in view
      const midLat = (center.lat + selectedCompanion.coordinates.lat) / 2;
      const midLng = (center.lng + selectedCompanion.coordinates.lng) / 2;
      map.panTo({ lat: midLat, lng: midLng });
    } else {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng, selectedCompanion]);

  return null;
};

const isValidGoogleMapsKey = (k: string): boolean => {
  if (!k) return false;
  const trimmed = k.trim();
  return (
    trimmed.startsWith('AIzaSy') &&
    trimmed.length >= 35 &&
    !trimmed.includes('AXmu-HjFsF4KMwY7IgH3w9mz1lmU8tX3Y') &&
    !trimmed.startsWith('AQ.')
  );
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  companions,
  selectedCompanion,
  activeSenior,
  maxDistance,
  onSelectCompanion,
  onBookCompanion,
  onRadiusChange,
  viewMode = 'both',
}) => {
  const [showRadiusZone, setShowRadiusZone] = useState(true);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>(() => {
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    return isValidGoogleMapsKey(envKey) ? envKey : '';
  });
  const [mapError, setMapError] = useState<boolean>(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState<boolean>(false);

  const hasValidKey = isValidGoogleMapsKey(googleMapsKey);

  // Intercept Google Maps JavaScript API authentication failures globally
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps API authentication failed (InvalidKeyMapError). Safely falling back to built-in Vector Map.');
      setMapError(true);
      setUseGoogleMaps(false);
    };

    return () => {
      if ((window as any).gm_authFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  // Fetch API key from backend if not already set via client environment
  useEffect(() => {
    if (!googleMapsKey) {
      fetch('/api/maps/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.apiKey && isValidGoogleMapsKey(data.apiKey)) {
            setGoogleMapsKey(data.apiKey);
          }
        })
        .catch(() => {});
    }
  }, [googleMapsKey]);

  // Coordinates projection for fallback SVG Map
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 37.745;
    const maxLat = 37.810;
    const minLng = -122.495;
    const maxLng = -122.400;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  };

  const seniorPos = projectCoords(activeSenior.coordinates.lat, activeSenior.coordinates.lng);

  // Dynamically scale SVG radius based on maxDistance (1-15 miles)
  const svgRadiusPixels = Math.max(35, Math.min(260, maxDistance * 24));

  // Determine container height based on viewMode
  const containerHeightClass =
    viewMode === 'map'
      ? 'h-[580px] sm:h-[660px]'
      : 'h-[400px] sm:h-[480px]';

  const seniorLocation = useMemo(
    () => ({
      lat: activeSenior.coordinates.lat,
      lng: activeSenior.coordinates.lng,
    }),
    [activeSenior.coordinates.lat, activeSenior.coordinates.lng]
  );

  const routeCoordinates = useMemo(() => {
    if (!selectedCompanion) return [];
    return [
      seniorLocation,
      {
        lat: selectedCompanion.coordinates.lat,
        lng: selectedCompanion.coordinates.lng,
      },
    ];
  }, [seniorLocation, selectedCompanion]);

  // ETA text for selected companion
  const travelEta = useMemo(() => {
    if (!selectedCompanion) return null;
    return estimateTravelTime(selectedCompanion.distanceMiles, 'driving');
  }, [selectedCompanion]);

  return (
    <div
      id="interactive-map-container"
      className={`relative w-full ${containerHeightClass} bg-[#eef3f0] rounded-3xl overflow-hidden border border-emerald-900/10 shadow-inner select-none transition-all duration-300`}
    >
      {/* Google Maps View */}
      {hasValidKey && useGoogleMaps && !mapError ? (
        <APIProvider
          apiKey={googleMapsKey}
          libraries={['geometry', 'places', 'marker']}
          onError={() => {
            setMapError(true);
            setUseGoogleMaps(false);
          }}
        >
          <Map
            id="compassionate-gmp-map"
            mapId="DEMO_MAP_ID"
            defaultCenter={seniorLocation}
            defaultZoom={13}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            className="w-full h-full"
            styles={compassionateCareMapStyle}
          >
            <MapEffectController center={seniorLocation} selectedCompanion={selectedCompanion} />

            {/* Dynamic Service Radius Circle */}
            {showRadiusZone && (
              <Circle
                center={seniorLocation}
                radius={milesToMeters(maxDistance)}
                strokeColor="#059669"
                strokeOpacity={0.85}
                strokeWeight={2}
                fillColor="#10b981"
                fillOpacity={0.12}
              />
            )}

            {/* Connecting Route to Selected Companion */}
            {selectedCompanion && routeCoordinates.length === 2 && (
              <Polyline
                path={routeCoordinates}
                strokeColor="#047857"
                strokeOpacity={0.9}
                strokeWeight={3}
              />
            )}

            {/* Senior Residence Residence Advanced Marker */}
            <AdvancedMarker position={seniorLocation} title={`${activeSenior.name}'s Residence`}>
              <div className="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -inset-2 bg-emerald-500/25 rounded-full animate-ping" />
                <div className="relative p-2.5 bg-emerald-800 text-white rounded-full shadow-xl border-2 border-white flex items-center justify-center ring-2 ring-emerald-600/30">
                  <HeartHandshake className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-emerald-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md pointer-events-none flex items-center space-x-1 border border-emerald-700/50">
                  <span>{activeSenior.name}'s Home</span>
                </div>
              </div>
            </AdvancedMarker>

            {/* Companion Pins on Google Map */}
            {companions.map((comp) => {
              const isSelected = selectedCompanion?.id === comp.id;

              return (
                <AdvancedMarker
                  key={comp.id}
                  position={{ lat: comp.coordinates.lat, lng: comp.coordinates.lng }}
                  onClick={() => onSelectCompanion(comp)}
                  title={`${comp.name} - $${comp.hourlyRate}/h (${comp.distanceMiles} mi)`}
                >
                  <div
                    id={`gmp-pin-${comp.id}`}
                    className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
                  >
                    <div
                      className={`relative flex flex-col items-center ${
                        isSelected ? 'scale-115 z-40' : ''
                      }`}
                    >
                      {/* Price Pill */}
                      <div
                        className={`mb-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-md flex items-center space-x-1 border transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-white ring-2 ring-emerald-600'
                            : 'bg-white text-gray-900 border-gray-200'
                        }`}
                      >
                        <span>${comp.hourlyRate}/h</span>
                        <span className="text-amber-500 flex items-center">
                          <Star className="w-2.5 h-2.5 fill-current inline" />
                          <span className="text-[10px] text-gray-700 ml-0.5">{comp.rating}</span>
                        </span>
                      </div>

                      {/* Avatar Pin */}
                      <div className="relative">
                        <img
                          src={comp.avatar}
                          alt={comp.name}
                          className={`w-10 h-10 rounded-full object-cover shadow-lg border-2 ${
                            isSelected
                              ? 'border-emerald-600 ring-4 ring-emerald-400/40'
                              : 'border-white'
                          }`}
                        />
                        {comp.vetting.checkrCleared && (
                          <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </APIProvider>
      ) : (
        /* Fallback High-Fidelity SVG Map View */
        <div className="relative w-full h-full">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="bayWater" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cde5f4" />
                <stop offset="100%" stopColor="#b4d7ef" />
              </linearGradient>

              <linearGradient id="parkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d4ebd8" />
                <stop offset="100%" stopColor="#c5e4cb" />
              </linearGradient>

              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e1eae4" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Base Background Land */}
            <rect width="800" height="500" fill="#f4f7f4" />
            <rect width="800" height="500" fill="url(#gridPattern)" />

            {/* SF Coastlines */}
            <path
              d="M 620,0 C 640,120 680,240 760,340 L 800,380 L 800,0 Z"
              fill="url(#bayWater)"
              opacity="0.85"
            />
            <path
              d="M 0,0 L 0,500 L 90,500 C 70,360 80,180 120,0 Z"
              fill="url(#bayWater)"
              opacity="0.45"
            />

            {/* Presidio & Golden Gate Park */}
            <rect x="180" y="30" width="220" height="100" rx="20" fill="url(#parkGrad)" />
            <text x="290" y="85" fill="#4d7756" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="2">
              THE PRESIDIO
            </text>

            <rect x="140" y="270" width="360" height="70" rx="14" fill="url(#parkGrad)" />
            <text x="320" y="310" fill="#4d7756" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="2">
              GOLDEN GATE PARK
            </text>

            {/* Major Arteries */}
            <path d="M 100,200 L 700,200" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
            <path d="M 100,200 L 700,200" stroke="#d5ded8" strokeWidth="2" strokeLinecap="round" />
            <text x="430" y="195" fill="#8ca094" fontSize="9" fontWeight="bold">GEARY BLVD</text>

            <path d="M 520,30 L 520,480" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
            <path d="M 520,30 L 520,480" stroke="#d5ded8" strokeWidth="2" strokeLinecap="round" />
            <text x="528" y="130" fill="#8ca094" fontSize="9" fontWeight="bold">VAN NESS AVE</text>

            <path d="M 380,440 L 680,170" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            <path d="M 380,440 L 680,170" stroke="#d1ded5" strokeWidth="3" strokeLinecap="round" />
            <text x="500" y="310" fill="#8ca094" fontSize="9" fontWeight="bold" transform="rotate(-42 500 310)">
              MARKET STREET
            </text>

            {/* Neighborhood Labels */}
            <text x="440" y="100" fill="#9db0a3" fontSize="11" fontWeight="700" letterSpacing="1">PACIFIC HEIGHTS</text>
            <text x="240" y="240" fill="#9db0a3" fontSize="11" fontWeight="700" letterSpacing="1">RICHMOND DISTRICT</text>
            <text x="250" y="380" fill="#9db0a3" fontSize="11" fontWeight="700" letterSpacing="1">SUNSET DISTRICT</text>
            <text x="540" y="390" fill="#9db0a3" fontSize="11" fontWeight="700" letterSpacing="1">MISSION DISTRICT</text>

            {/* Mathematically Scaled Radius Zone around Senior Home */}
            {showRadiusZone && (
              <g>
                <circle
                  cx={`${seniorPos.x}%`}
                  cy={`${seniorPos.y}%`}
                  r={svgRadiusPixels}
                  fill="#008779"
                  fillOpacity="0.09"
                  stroke="#008779"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <circle
                  cx={`${seniorPos.x}%`}
                  cy={`${seniorPos.y}%`}
                  r={svgRadiusPixels * 0.55}
                  fill="#008779"
                  fillOpacity="0.08"
                  stroke="#008779"
                  strokeWidth="1"
                />
              </g>
            )}

            {/* Route Line to Selected Companion */}
            {selectedCompanion && (
              <line
                x1={`${seniorPos.x}%`}
                y1={`${seniorPos.y}%`}
                x2={`${projectCoords(selectedCompanion.coordinates.lat, selectedCompanion.coordinates.lng).x}%`}
                y2={`${projectCoords(selectedCompanion.coordinates.lat, selectedCompanion.coordinates.lng).y}%`}
                stroke="#008779"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Senior's Residence Marker (SVG mode) */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{ left: `${seniorPos.x}%`, top: `${seniorPos.y}%` }}
          >
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative p-2 bg-emerald-800 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-emerald-100" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-emerald-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md pointer-events-none flex items-center space-x-1">
                <span>{activeSenior.name}'s Home</span>
              </div>
            </div>
          </div>

          {/* Companion Pins (SVG mode) */}
          {companions.map((comp) => {
            const isSelected = selectedCompanion?.id === comp.id;
            const pos = projectCoords(comp.coordinates.lat, comp.coordinates.lng);

            return (
              <div
                key={comp.id}
                onClick={() => onSelectCompanion(comp)}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                id={`map-pin-${comp.id}`}
              >
                <div className={`relative flex flex-col items-center ${isSelected ? 'scale-115 z-40' : ''}`}>
                  <div
                    className={`mb-1 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-md flex items-center space-x-1 border transition-all ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-white ring-2 ring-emerald-600'
                        : 'bg-white text-gray-900 border-gray-200'
                    }`}
                  >
                    <span>${comp.hourlyRate}/h</span>
                    <span className="text-amber-500 flex items-center">
                      <Star className="w-2.5 h-2.5 fill-current inline" />
                      <span className="text-[10px] text-gray-700 ml-0.5">{comp.rating}</span>
                    </span>
                  </div>

                  <div className="relative">
                    <img
                      src={comp.avatar}
                      alt={comp.name}
                      className={`w-10 h-10 rounded-full object-cover shadow-lg border-2 ${
                        isSelected ? 'border-emerald-600 ring-4 ring-emerald-400/40' : 'border-white'
                      }`}
                    />
                    {comp.vetting.checkrCleared && (
                      <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end space-y-1.5 pointer-events-auto">
        {/* Radius Toggle & Readout */}
        <button
          onClick={() => setShowRadiusZone(!showRadiusZone)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5 backdrop-blur-md border border-emerald-900/10 ${
            showRadiusZone
              ? 'bg-emerald-800 text-white shadow-emerald-900/20'
              : 'bg-white/95 text-gray-700 hover:bg-white'
          }`}
          title="Toggle search radius circle"
          id="toggle-radius-button"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">{maxDistance} mi radius</span>
        </button>

        {/* Quick Radius Presets Pill */}
        {onRadiusChange && (
          <div className="bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-md border border-gray-200 flex items-center space-x-1 text-[10px] font-bold">
            <span className="text-gray-400 pl-1">Preset:</span>
            {[3, 5, 8, 12].map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className={`px-1.5 py-0.5 rounded-md transition-all ${
                  maxDistance === r
                    ? 'bg-emerald-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={`Set radius to ${r} miles`}
              >
                {r}m
              </button>
            ))}
          </div>
        )}

        {/* Engine Switcher (Google Maps vs Stylized Vector) */}
        {hasValidKey ? (
          <button
            onClick={() => {
              setUseGoogleMaps(!useGoogleMaps);
              setMapError(false);
            }}
            className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-gray-700 hover:bg-white shadow-sm border border-gray-200 flex items-center space-x-1"
            title="Switch map rendering engine"
            id="toggle-map-engine-button"
          >
            <Layers className="w-3 h-3 text-emerald-700" />
            <span>{useGoogleMaps && !mapError ? 'Google Maps' : 'Vector Map'}</span>
          </button>
        ) : (
          <div
            className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-xl text-[10px] font-bold text-emerald-800 shadow-sm border border-emerald-200/80 flex items-center space-x-1"
            title="High-fidelity interactive vector map active (No external API key required)"
            id="map-engine-status-badge"
          >
            <Layers className="w-3 h-3 text-emerald-700" />
            <span>Vector Map</span>
          </div>
        )}
      </div>

      {/* Floating Map Legend Bottom-Left */}
      <div className="absolute top-3 left-3 z-30 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center space-x-2 text-xs font-semibold text-gray-700">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
          <span className="text-[11px]">{activeSenior.name.split(' ')[0]}'s Home Base</span>
          <span className="text-gray-300">|</span>
          <span className="text-[11px] text-emerald-800 font-bold">
            {companions.length} within {maxDistance} mi
          </span>
        </div>
      </div>

      {/* Floating Companion Quick Card when Selected */}
      {selectedCompanion && (
        <div
          className="absolute bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-emerald-100 flex items-center justify-between space-x-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
          id="map-selected-companion-card"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src={selectedCompanion.avatar}
              alt={selectedCompanion.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-600/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h4 className="font-bold text-sm text-gray-900 truncate">{selectedCompanion.name}</h4>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-xs text-gray-500 truncate">
                {selectedCompanion.locationName} &bull; {formatDistanceText(selectedCompanion.distanceMiles)}
                {travelEta && (
                  <span className="text-emerald-700 font-medium ml-1">({travelEta.text})</span>
                )}
              </p>
              <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-800 mt-0.5">
                <span>{formatCurrency(selectedCompanion.hourlyRate)}/hr</span>
                <span className="text-gray-400">&bull;</span>
                <span className="text-amber-600 flex items-center">
                  <Star className="w-3 h-3 fill-current inline mr-0.5" />
                  {selectedCompanion.rating} ({selectedCompanion.reviewCount})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onBookCompanion(selectedCompanion)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-sm flex items-center space-x-1.5 transition-transform active:scale-95"
              id={`map-book-btn-${selectedCompanion.id}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Visit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
