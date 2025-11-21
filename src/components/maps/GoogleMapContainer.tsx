import React, { useEffect, useRef, useState } from 'react';
import type { History, Trip } from '../../types/history';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';
import type { Vehicle } from '../../types/vehicle';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}

// Google Maps type definitions
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      panTo(latlng: LatLng): void;
      fitBounds(bounds: LatLngBounds): void;
      getMapTypeId(): MapTypeId;
      setMapTypeId(mapTypeId: MapTypeId): void;
      getVisibleRegion(): Promise<LatLngBounds>;
      getZoom(): number;
      setZoom(zoom: number): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      latitude(): number;
      longitude(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(point: LatLng): void;
      southwest: LatLng;
      northeast: LatLng;
    }

    class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setPosition(position: LatLng): void;
      setMap(map: Map | null): void;
      setIcon(icon: Icon | Symbol): void;
      getPosition(): LatLng;
      getTitle(): string;
      getIcon(): Icon | Symbol;
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
    }

    interface MapOptions {
      zoom: number;
      center: LatLng;
      mapTypeId: MapTypeId;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map | null;
      title?: string;
      icon?: Icon | Symbol;
      animation?: Animation;
      label?: {
        text: string;
        color?: string;
        fontSize?: string;
        fontWeight?: string;
      };
    }

    interface PolylineOptions {
      path: LatLng[];
      geodesic?: boolean;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    interface Icon {
      path?: SymbolPath | string;
      url?: string;
      scale?: number;
      scaledSize?: Size;
      anchor?: Point;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      rotation?: number;
    }

    interface Symbol {
      path: SymbolPath | string;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      rotation?: number;
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4
    }

    enum Animation {
      BOUNCE = 1,
      DROP = 2
    }
  }
}

interface StopPoint {
  trip: Trip;
  nextTrip: Trip | null;
  arrivalTime: string | null;
  departureTime: string | null;
  duration: number;
  lat: number;
  lng: number;
}

interface InterpolatedPoint {
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  createdAt?: string;
}

interface GoogleMapContainerProps {
  historyData: History[];
  vehicle?: Vehicle;
  playbackState?: {
    currentIndex: number;
    isPlaying: boolean;
    currentSpeed?: number;
    currentDateTime?: string;
    progress?: number;
  };
  interpolatedRoute?: InterpolatedPoint[];
  stopPoints?: StopPoint[];
  selectedTrip?: any;
  onStopPointClick?: (stopPoint: StopPoint) => void;
  className?: string;
}

const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({
  historyData,
  vehicle,
  playbackState,
  interpolatedRoute = [],
  stopPoints = [],
  selectedTrip,
  onStopPointClick,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const stopPointMarkersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [originalZoom, setOriginalZoom] = useState<number>(GOOGLE_MAPS_CONFIG.defaultZoom);

  useEffect(() => {
    // Check if Google Maps is loaded
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && historyData.length > 0 && !playbackState?.isPlaying) {
      updateMapWithHistory();
    }
  }, [historyData, mapLoaded, playbackState?.isPlaying, stopPoints, selectedTrip]);

  useEffect(() => {
    if (mapLoaded && playbackState?.isPlaying) {
      // Enter playback mode - zoom in and follow marker
      if (!isPlaybackMode) {
        enterPlaybackMode();
      }
      updatePlaybackPosition();
    } else if (mapLoaded && !playbackState?.isPlaying && historyData.length > 0) {
      // Exit playback mode - restore full route and original zoom
      if (isPlaybackMode) {
        exitPlaybackMode();
      }
      updateMapWithHistory();
    }
  }, [playbackState, mapLoaded, historyData, isPlaybackMode]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Get location data for initial center
    const locationData = historyData.filter(h => h.type === 'location' && h.latitude && h.longitude);

    let center: google.maps.LatLng;
    if (locationData.length > 0) {
      center = new google.maps.LatLng(locationData[0].latitude!, locationData[0].longitude!);
    } else {
      // Default to Kathmandu, Nepal
      center = new google.maps.LatLng(GOOGLE_MAPS_CONFIG.defaultCenter.lat, GOOGLE_MAPS_CONFIG.defaultCenter.lng);
    }

    const map = new google.maps.Map(mapRef.current, {
      zoom: GOOGLE_MAPS_CONFIG.defaultZoom,
      center: center,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);
  };

  const updateMapWithHistory = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers and polylines
    clearMap();

    // Clear stop points if a trip is selected
    if (selectedTrip) {
      stopPointMarkersRef.current.forEach(marker => marker.setMap(null));
      stopPointMarkersRef.current = [];
    }

    const locationData = historyData.filter(h => h.type === 'location' && h.latitude && h.longitude);

    if (locationData.length === 0) return;

    // Create route path
    const routePath = locationData.map(point =>
      new google.maps.LatLng(point.latitude!, point.longitude!)
    );

    // Draw polyline for the route
    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    polyline.setMap(mapInstanceRef.current);
    polylinesRef.current.push(polyline);

    // Add start marker (green circle with S)
    if (locationData.length > 0) {
      const startMarker = new google.maps.Marker({
        position: new google.maps.LatLng(locationData[0].latitude!, locationData[0].longitude!),
        map: mapInstanceRef.current,
        title: 'Start Point',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: {
          text: 'S',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(startMarker);

      // Add vehicle marker at start point (like live tracking)
      addVehicleMarker(locationData[0], false);
    }

    // Add end marker (red circle with E)
    if (locationData.length > 1) {
      const endMarker = new google.maps.Marker({
        position: new google.maps.LatLng(
          locationData[locationData.length - 1].latitude!,
          locationData[locationData.length - 1].longitude!
        ),
        map: mapInstanceRef.current,
        title: 'End Point',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: {
          text: 'E',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(endMarker);
    }

    // Add stop point markers (only when not showing single trip and not in playback mode)
    if (!selectedTrip && stopPoints.length > 0 && !playbackState?.isPlaying) {
      addStopPointMarkers();
    }

    // Fit map to show all points
    if (routePath.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      routePath.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const addStopPointMarkers = () => {
    if (!mapInstanceRef.current || !onStopPointClick) return;

    // Clear existing stop point markers
    stopPointMarkersRef.current.forEach(marker => marker.setMap(null));
    stopPointMarkersRef.current = [];

    // Add stop point markers
    stopPoints.forEach((stopPoint) => {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(stopPoint.lat, stopPoint.lng),
        map: mapInstanceRef.current,
        title: `Stop Point ${stopPoint.trip.tripNumber}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add click listener
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (onStopPointClick) {
        (marker as any).addListener('click', () => {
          onStopPointClick(stopPoint);
        });
      }

      stopPointMarkersRef.current.push(marker);
    });
  };

  const addVehicleMarker = (point: History, isMoving: boolean = false) => {
    if (!mapInstanceRef.current || !vehicle) return;

    // Remove existing vehicle marker
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setMap(null);
    }

    // Calculate rotation based on course or direction
    let rotation = 0;
    if (point.course !== undefined && point.course !== null) {
      rotation = point.course;
    }

    // Determine vehicle state based on speed and ignition
    // const vehicleState = isMoving ? VehicleState.RUNNING : VehicleState.STOPPED;

    // Create vehicle marker with rotatable arrow icon
    const vehicleMarker = new google.maps.Marker({
      position: new google.maps.LatLng(point.latitude!, point.longitude!),
      map: mapInstanceRef.current,
      title: isMoving ? 'Vehicle Moving' : 'Vehicle Position',
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 4,
        fillColor: isMoving ? '#3B82F6' : '#6B7280',
        fillOpacity: 1,
        strokeColor: isMoving ? '#1E40AF' : '#374151',
        strokeWeight: 2,
        rotation: rotation,
      },
      animation: isMoving ? google.maps.Animation.BOUNCE : undefined,
    });

    vehicleMarkerRef.current = vehicleMarker;
  };

  const enterPlaybackMode = () => {
    if (!mapInstanceRef.current) return;

    // Store current zoom level
    setOriginalZoom(mapInstanceRef.current.getZoom() || GOOGLE_MAPS_CONFIG.defaultZoom);

    // Set playback mode
    setIsPlaybackMode(true);

    // Zoom in for better marker visibility during playback
    mapInstanceRef.current.setZoom(15);

    console.log('Entered playback mode - zoomed in to level 18');
  };

  const exitPlaybackMode = () => {
    if (!mapInstanceRef.current) return;

    // Restore original zoom level
    mapInstanceRef.current.setZoom(originalZoom);

    // Exit playback mode
    setIsPlaybackMode(false);

    console.log('Exited playback mode - restored zoom to level', originalZoom);
  };

  const updatePlaybackPosition = () => {
    if (!mapInstanceRef.current || !playbackState?.isPlaying) return;

    // Use interpolated route if available, otherwise fall back to history data
    const routePoints = interpolatedRoute.length > 0 ? interpolatedRoute : 
      historyData.filter(h => h.type === 'location' && h.latitude && h.longitude).map(h => ({
        latitude: h.latitude!,
        longitude: h.longitude!,
        speed: h.speed,
        course: h.course,
        createdAt: h.createdAt,
      }));

    if (playbackState.currentIndex >= routePoints.length) return;

    const currentPoint = routePoints[playbackState.currentIndex];
    const nextPoint = routePoints[playbackState.currentIndex + 1];
    const prevPoint = routePoints[playbackState.currentIndex - 1];

    // Calculate smooth rotation based on movement direction
    let rotation = 0;

    // Priority 1: Use course from interpolated point if available and valid
    if (currentPoint.course !== undefined && currentPoint.course !== null && currentPoint.course >= 0 && currentPoint.course <= 360) {
      rotation = currentPoint.course;
    }
    // Priority 2: Calculate bearing to next point for moving vehicle
    else if (nextPoint) {
      rotation = calculateBearing(
        currentPoint.latitude, currentPoint.longitude,
        nextPoint.latitude, nextPoint.longitude
      );
    }
    // Priority 3: Calculate bearing from previous point (for last point or stationary)
    else if (prevPoint) {
      rotation = calculateBearing(
        prevPoint.latitude, prevPoint.longitude,
        currentPoint.latitude, currentPoint.longitude
      );
    }

    // Update vehicle marker with smooth movement and rotation
    if (vehicleMarkerRef.current) {
      // Smooth position update using interpolated point
      const newPosition = new google.maps.LatLng(currentPoint.latitude, currentPoint.longitude);
      vehicleMarkerRef.current.setPosition(newPosition);

      // Update rotation smoothly with proper icon handling
      updateVehicleMarkerRotation(rotation);
    } else {
      // Create new vehicle marker if it doesn't exist
      const historyPoint: History = {
        imei: '',
        type: 'location',
        dataType: 'location',
        latitude: currentPoint.latitude,
        longitude: currentPoint.longitude,
        speed: currentPoint.speed,
        course: currentPoint.course,
        createdAt: currentPoint.createdAt,
      };
      addVehicleMarker(historyPoint, true);
    }

    // Enhanced camera movement - smooth pan with zoom following
    if (mapInstanceRef.current) {
      const newCenter = new google.maps.LatLng(currentPoint.latitude!, currentPoint.longitude!);

      // Use smooth panTo for better user experience
      mapInstanceRef.current.panTo(newCenter);

      // Optional: Add slight zoom adjustment based on speed for dynamic effect
      const speedBasedZoom = 15;
      const currentZoom = mapInstanceRef.current.getZoom() || 18;

      // Only adjust zoom if there's a significant difference to avoid jittery behavior
      if (Math.abs(currentZoom - speedBasedZoom) > 0.5) {
        mapInstanceRef.current.setZoom(speedBasedZoom);
      }
    }
  };

  const updateVehicleMarkerRotation = (targetRotation: number) => {
    if (!vehicleMarkerRef.current || !vehicle) return;

    console.log('Updating vehicle marker rotation to:', targetRotation);

    // Get current icon properties
    const currentIcon = vehicleMarkerRef.current.getIcon() as google.maps.Icon;
    const currentRotation = (currentIcon && typeof currentIcon === 'object' && currentIcon.rotation) ? currentIcon.rotation : 0;

    // Apply smooth rotation to avoid jarring 360-degree jumps
    const smoothTargetRotation = smoothRotation(currentRotation, targetRotation);

    console.log('Current rotation:', currentRotation, 'Smooth target:', smoothTargetRotation);

    // Create a rotated icon using SymbolPath
    const rotatedIcon = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 4,
      fillColor: '#3B82F6',
      fillOpacity: 1,
      strokeColor: '#1E40AF',
      strokeWeight: 2,
      rotation: smoothTargetRotation,
    };

    // Update icon with rotation
    vehicleMarkerRef.current.setIcon(rotatedIcon);
    console.log('Vehicle marker icon updated with rotation:', smoothTargetRotation);
  };


  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  const smoothRotation = (currentRotation: number, targetRotation: number): number => {
    // Handle the 360-degree wrap-around for smooth rotation
    const diff = targetRotation - currentRotation;

    if (Math.abs(diff) > 180) {
      if (diff > 0) {
        return currentRotation + (diff - 360);
      } else {
        return currentRotation + (diff + 360);
      }
    }

    return targetRotation;
  };

  const clearMap = () => {
    // Clear markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear stop point markers
    stopPointMarkersRef.current.forEach(marker => marker.setMap(null));
    stopPointMarkersRef.current = [];

    // Clear vehicle marker
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setMap(null);
      vehicleMarkerRef.current = null;
    }

    // Clear polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full border border-gray-300 rounded-lg"
        style={{ minHeight: '400px' }}
      />

        {/* Full-Width Stats Bar - Bottom */}
        {playbackState?.isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-12 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 text-white shadow-lg border-t border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between h-full px-4">
              {/* Left Side - Live Indicator & Time */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-30"></div>
                  </div>
                  <span className="text-xs font-bold text-green-100 tracking-wide">LIVE</span>
                </div>
                <div className="h-6 w-px bg-green-400/40"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-green-200 font-medium uppercase tracking-wide">Time</span>
                  <span className="text-sm font-bold text-white font-mono leading-tight">
                    {playbackState.currentDateTime ?
                      new Date(playbackState.currentDateTime).toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Center - Progress */}
              <div className="flex-1 mx-4">
                <div className="w-full h-1.5 bg-green-400/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${(playbackState?.progress || 0) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-green-200 text-center mt-0.5">
                  {Math.round((playbackState?.progress || 0) * 100)}%
                </div>
              </div>

              {/* Right Side - Speed */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs text-green-200 font-medium uppercase tracking-wide">Speed</div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-black text-white font-mono">
                      {(playbackState?.currentSpeed || 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-green-200 font-bold">km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Map Type Toggle */}
      <div className="absolute top-16 right-4 z-10">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              const currentMapType = mapInstanceRef.current.getMapTypeId();
              const newMapType = currentMapType === google.maps.MapTypeId.ROADMAP
                ? google.maps.MapTypeId.HYBRID
                : google.maps.MapTypeId.ROADMAP;
              mapInstanceRef.current.setMapTypeId(newMapType);
            }
          }}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-lg shadow-sm border border-gray-300"
          title="Toggle Map Type"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GoogleMapContainer;
