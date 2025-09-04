import React, { useEffect, useRef, useState } from 'react';
import type { History } from '../../types/history';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapContainerProps {
  historyData: History[];
  playbackState?: {
    currentIndex: number;
    isPlaying: boolean;
  };
  className?: string;
}

const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({ 
  historyData, 
  playbackState,
  className = '' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
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
    if (mapLoaded && historyData.length > 0) {
      updateMapWithHistory();
    }
  }, [historyData, mapLoaded]);

  useEffect(() => {
    if (mapLoaded && playbackState?.isPlaying) {
      updatePlaybackPosition();
    }
  }, [playbackState, mapLoaded]);

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

    // Add start marker
    if (locationData.length > 0) {
      const startMarker = new google.maps.Marker({
        position: new google.maps.LatLng(locationData[0].latitude!, locationData[0].longitude!),
        map: mapInstanceRef.current,
        title: 'Start Point',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: 'S',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });
      markersRef.current.push(startMarker);
    }

    // Add end marker
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
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: 'E',
          color: 'white',
          fontSize: '12px',
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

  const updatePlaybackPosition = () => {
    if (!mapInstanceRef.current || !playbackState?.isPlaying) return;

    const locationData = historyData.filter(h => h.type === 'location' && h.latitude && h.longitude);
    
    if (playbackState.currentIndex >= locationData.length) return;

    const currentPoint = locationData[playbackState.currentIndex];
    
    // Remove existing vehicle marker
    const existingVehicleMarker = markersRef.current.find(marker => 
      marker.getTitle() === 'Vehicle Position'
    );
    if (existingVehicleMarker) {
      existingVehicleMarker.setMap(null);
      const index = markersRef.current.indexOf(existingVehicleMarker);
      if (index > -1) {
        markersRef.current.splice(index, 1);
      }
    }

    // Add new vehicle marker
    const vehicleMarker = new google.maps.Marker({
      position: new google.maps.LatLng(currentPoint.latitude!, currentPoint.longitude!),
      map: mapInstanceRef.current,
      title: 'Vehicle Position',
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#F59E0B',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        rotation: currentPoint.course || 0,
      },
    });
    markersRef.current.push(vehicleMarker);

    // Center map on vehicle position
    mapInstanceRef.current.panTo(new google.maps.LatLng(currentPoint.latitude!, currentPoint.longitude!));
  };

  const clearMap = () => {
    // Clear markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

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
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm z-10">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>End Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Route</span>
          </div>
          {playbackState?.isPlaying && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Current Position</span>
            </div>
          )}
        </div>
      </div>

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
      <div className="absolute top-4 right-4 z-10">
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
