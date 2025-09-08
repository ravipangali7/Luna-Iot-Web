import React, { useEffect, useRef, useState } from 'react';
import type { History } from '../../types/history';
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
  className?: string;
}

const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({ 
  historyData, 
  vehicle,
  playbackState,
  className = '' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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
  }, [historyData, mapLoaded, playbackState?.isPlaying]);

  useEffect(() => {
    if (mapLoaded && playbackState?.isPlaying) {
      updatePlaybackPosition();
    } else if (mapLoaded && !playbackState?.isPlaying && historyData.length > 0) {
      // Restore full route when playback stops
      updateMapWithHistory();
    }
  }, [playbackState, mapLoaded, historyData]);

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

    // Fit map to show all points
    if (routePath.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      routePath.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);
    }
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

  const updatePlaybackPosition = () => {
    if (!mapInstanceRef.current || !playbackState?.isPlaying) return;

    const locationData = historyData.filter(h => h.type === 'location' && h.latitude && h.longitude);
    
    if (playbackState.currentIndex >= locationData.length) return;

    const currentPoint = locationData[playbackState.currentIndex];
    const nextPoint = locationData[playbackState.currentIndex + 1];
    const prevPoint = locationData[playbackState.currentIndex - 1];
    
    // Calculate smooth rotation based on movement direction
    let rotation = 0;
    
    // Priority 1: Use course from GPS data if available and valid
    if (currentPoint.course !== undefined && currentPoint.course !== null && currentPoint.course >= 0 && currentPoint.course <= 360) {
      rotation = currentPoint.course;
      console.log('Using GPS course:', rotation);
    }
    // Priority 2: Calculate bearing to next point for moving vehicle
    else if (nextPoint) {
      rotation = calculateBearing(
        currentPoint.latitude!, currentPoint.longitude!,
        nextPoint.latitude!, nextPoint.longitude!
      );
      console.log('Calculated bearing to next point:', rotation);
    }
    // Priority 3: Calculate bearing from previous point (for last point or stationary)
    else if (prevPoint) {
      rotation = calculateBearing(
        prevPoint.latitude!, prevPoint.longitude!,
        currentPoint.latitude!, currentPoint.longitude!
      );
      console.log('Calculated bearing from previous point:', rotation);
    }
    
    // Add slight variation based on speed for more realistic movement
    const speed = currentPoint.speed || 0;
    if (speed > 0) {
      // Add small random variation for more natural movement
      const variation = (Math.random() - 0.5) * 2; // ±1 degree variation
      rotation = (rotation + variation + 360) % 360;
    }
    
    console.log('Final rotation:', rotation, 'Speed:', speed);

    // Update polyline to show only remaining route (trail effect)
    updatePolylineTrail(locationData, playbackState.currentIndex);

    // Update vehicle marker with smooth movement and rotation
    if (vehicleMarkerRef.current) {
      // Smooth position update
      const newPosition = new google.maps.LatLng(currentPoint.latitude!, currentPoint.longitude!);
      vehicleMarkerRef.current.setPosition(newPosition);
      
      // Update rotation smoothly with proper icon handling
      updateVehicleMarkerRotation(rotation);
    } else {
      // Create new vehicle marker if it doesn't exist
      addVehicleMarker(currentPoint, true);
    }

    // Smooth camera movement to follow vehicle
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(new google.maps.LatLng(currentPoint.latitude!, currentPoint.longitude!));
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

  const updatePolylineTrail = (locationData: History[], currentIndex: number) => {
    if (!mapInstanceRef.current) return;

    // Clear existing polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    // Create new polyline with only remaining points (from current position to end)
    const remainingPoints = locationData.slice(currentIndex).map(point => 
      new google.maps.LatLng(point.latitude!, point.longitude!)
    );

    if (remainingPoints.length > 1) {
      const polyline = new google.maps.Polyline({
        path: remainingPoints,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 1.0,
        strokeWeight: 4,
      });

      polyline.setMap(mapInstanceRef.current);
      polylinesRef.current.push(polyline);
    }
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
      
      {/* Stats Overlay */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm z-10">
        <div className="text-sm space-y-1">
          <div>Total Points: {historyData.filter(h => h.type === 'location').length}</div>
          <div>Date Range: {historyData.length > 0 ? new Date(historyData[0].createdAt || '').toLocaleDateString() : 'N/A'}</div>
          {playbackState?.isPlaying && (
            <div>Current: {playbackState.currentIndex + 1}</div>
          )}
        </div>
      </div>

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
