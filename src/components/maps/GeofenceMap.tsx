import React, { useState, useCallback, useRef, useEffect } from 'react';
import GoogleMapReact from 'google-map-react';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';
import Button from '../ui/buttons/Button';
import Alert from '../ui/common/Alert';
import Spinner from '../ui/common/Spinner';

// Google Maps types - using any to avoid complex type definitions
declare const google: any;

// GeoJSON type definitions
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

type GeoJSONGeometry = GeoJSONPolygon | GeoJSONMultiPolygon;

interface GeofenceMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  boundary?: GeoJSONGeometry | null;
  onBoundaryChange: (boundary: GeoJSONGeometry | null) => void;
  readOnly?: boolean;
  height?: string;
  fitToBounds?: boolean; // New prop
}

interface MapRef {
  map: any | null;
  drawingManager: any | null;
  currentPolygon: any | null;
  clickListener: any | null;
  markers: any[];
}

const GeofenceMap: React.FC<GeofenceMapProps> = ({
  center = GOOGLE_MAPS_CONFIG.defaultCenter,
  zoom = GOOGLE_MAPS_CONFIG.defaultZoom,
  boundary = null,
  onBoundaryChange,
  readOnly = false,
  height = '400px',
  fitToBounds = false // New prop
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [drawingLibraryLoaded, setDrawingLibraryLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
  const mapRef = useRef<MapRef>({
    map: null,
    drawingManager: null,
    currentPolygon: null,
    clickListener: null,
    markers: []
  });

  // Convert GeoJSON to Google Maps Polygon
  const geoJSONToPolygon = useCallback((geoJSON: GeoJSONGeometry): any | null => {
    if (!mapRef.current.map) return null;

    try {
      if (geoJSON.type === 'Polygon') {
        const path = geoJSON.coordinates[0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));

        return new google.maps.Polygon({
          paths: path,
          ...GOOGLE_MAPS_CONFIG.geofenceStyles.default
        });
      } else if (geoJSON.type === 'MultiPolygon') {
        // For MultiPolygon, we'll use the first polygon for now
        const path = geoJSON.coordinates[0][0].map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));

        return new google.maps.Polygon({
          paths: path,
          ...GOOGLE_MAPS_CONFIG.geofenceStyles.default
        });
      }
    } catch (err) {
      console.error('Error converting GeoJSON to Polygon:', err);
      setError('Invalid boundary data');
    }

    return null;
  }, []);

  // Convert Google Maps Polygon to GeoJSON
  const polygonToGeoJSON = useCallback((polygon: any): GeoJSONGeometry => {
    const path = polygon.getPath();
    const coordinates: number[][][] = [[]];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates[0].push([point.lng(), point.lat()]);
    }

    // Ensure polygon is closed
    if (coordinates[0].length > 0) {
      const first = coordinates[0][0];
      const last = coordinates[0][coordinates[0].length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates[0].push([first[0], first[1]]);
      }
    }

    return {
      type: 'Polygon',
      coordinates
    };
  }, []);

  // Update polygon preview
  const updatePolygonPreview = useCallback((points: { lat: number; lng: number }[]) => {
    if (!mapRef.current.map || points.length < 2) return;

    // Clear existing preview polygon
    if (mapRef.current.currentPolygon) {
      mapRef.current.currentPolygon.setMap(null);
    }

    // Create preview polygon
    const polygon = new google.maps.Polygon({
      paths: points,
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: false,
      zIndex: 1,
    });

    polygon.setMap(mapRef.current.map);
    mapRef.current.currentPolygon = polygon;
  }, []);

  // Initialize click-to-add-points drawing
  const initializeClickDrawing = useCallback(() => {
    if (!mapRef.current.map || readOnly) return;
    
    setDrawingLibraryLoaded(true);
  }, [readOnly]);

  // Load existing boundary
  const loadExistingBoundary = useCallback(() => {
    if (!boundary || !mapRef.current.map) return;

    const polygon = geoJSONToPolygon(boundary);
    if (polygon) {
      polygon.setMap(mapRef.current.map);
      mapRef.current.currentPolygon = polygon;
    }
  }, [boundary, geoJSONToPolygon]);

  // Map initialization
  const onMapLoad = useCallback((map: any) => {
    mapRef.current.map = map;
    setMapLoaded(true);
    setError(null);

    // Wait for drawing library to load with timeout
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max
    
    const checkDrawingLibrary = () => {
      if (window.google?.maps) {
        if (!readOnly) {
          initializeClickDrawing();
        }
        loadExistingBoundary();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkDrawingLibrary, 100);
      } else {
        // Timeout reached, proceed without drawing library
        console.warn('Google Maps failed to load after 5 seconds');
        setDrawingLibraryLoaded(true);
        loadExistingBoundary();
      }
    };

    checkDrawingLibrary();
  }, [readOnly, initializeClickDrawing, loadExistingBoundary]);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!mapRef.current.map || readOnly) return;

    // Clear existing polygon and points
    if (mapRef.current.currentPolygon) {
      mapRef.current.currentPolygon.setMap(null);
      mapRef.current.currentPolygon = null;
    }
    
    // Clear markers
    mapRef.current.markers.forEach(marker => marker.setMap(null));
    mapRef.current.markers = [];
    
    setDrawingPoints([]);
    onBoundaryChange(null);
    setIsDrawing(true);

    // Add click listener
    const clickListener = mapRef.current.map.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      setDrawingPoints(prev => {
        const newPoints = [...prev, { lat, lng }];
        
        // Add marker for the point
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current.map,
          title: `Point ${newPoints.length}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
        
        mapRef.current.markers.push(marker);
        
        // Update polygon preview
        updatePolygonPreview(newPoints);
        
        return newPoints;
      });
    });
    
    mapRef.current.clickListener = clickListener;
  }, [readOnly, onBoundaryChange, updatePolygonPreview]);

  // Complete polygon
  const completePolygon = useCallback(() => {
    if (drawingPoints.length < 3) {
      setError('At least 3 points are required to create a polygon');
      return;
    }

    // Remove click listener
    if (mapRef.current.clickListener) {
      google.maps.event.removeListener(mapRef.current.clickListener);
      mapRef.current.clickListener = null;
    }

    // Close the polygon by adding the first point at the end
    const closedPoints = [...drawingPoints, drawingPoints[0]];
    
    // Create final polygon
    const polygon = new google.maps.Polygon({
      paths: closedPoints,
      ...GOOGLE_MAPS_CONFIG.geofenceStyles.default
    });

    polygon.setMap(mapRef.current.map);
    mapRef.current.currentPolygon = polygon;

    // Convert to GeoJSON
    const geoJSON = polygonToGeoJSON(polygon);
    onBoundaryChange(geoJSON);

    setIsDrawing(false);
    setError(null);
  }, [drawingPoints, onBoundaryChange, polygonToGeoJSON]);

  // Undo last point
  const undoLastPoint = useCallback(() => {
    if (drawingPoints.length === 0) return;

    // Remove last marker
    const lastMarker = mapRef.current.markers.pop();
    if (lastMarker) {
      lastMarker.setMap(null);
    }

    // Update points
    const newPoints = drawingPoints.slice(0, -1);
    setDrawingPoints(newPoints);

    // Update polygon preview
    if (newPoints.length >= 2) {
      updatePolygonPreview(newPoints);
    } else {
      // Clear polygon if less than 2 points
      if (mapRef.current.currentPolygon) {
        mapRef.current.currentPolygon.setMap(null);
        mapRef.current.currentPolygon = null;
      }
    }
  }, [drawingPoints, updatePolygonPreview]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    // Remove click listener
    if (mapRef.current.clickListener) {
      google.maps.event.removeListener(mapRef.current.clickListener);
      mapRef.current.clickListener = null;
    }

    // Clear markers
    mapRef.current.markers.forEach(marker => marker.setMap(null));
    mapRef.current.markers = [];

    // Clear polygon
    if (mapRef.current.currentPolygon) {
      mapRef.current.currentPolygon.setMap(null);
      mapRef.current.currentPolygon = null;
    }

    setDrawingPoints([]);
    setIsDrawing(false);
    setError(null);
    onBoundaryChange(null);
  }, [onBoundaryChange]);

  // Clear boundary
  const clearBoundary = useCallback(() => {
    // Remove click listener
    if (mapRef.current.clickListener) {
      google.maps.event.removeListener(mapRef.current.clickListener);
      mapRef.current.clickListener = null;
    }

    // Clear markers
    mapRef.current.markers.forEach(marker => marker.setMap(null));
    mapRef.current.markers = [];

    // Clear polygon
    if (mapRef.current.currentPolygon) {
      mapRef.current.currentPolygon.setMap(null);
      mapRef.current.currentPolygon = null;
    }

    setDrawingPoints([]);
    setIsDrawing(false);
    setError(null);
    onBoundaryChange(null);
  }, [onBoundaryChange]);

  // Edit existing polygon
  const editPolygon = useCallback(() => {
    if (!mapRef.current.currentPolygon || readOnly) return;

    // Make polygon editable
    mapRef.current.currentPolygon.setEditable(true);
    mapRef.current.currentPolygon.setOptions(GOOGLE_MAPS_CONFIG.geofenceStyles.editing);

    // Listen for changes
    const listener = mapRef.current.currentPolygon.getPath().addListener('set_at', () => {
      const geoJSON = polygonToGeoJSON(mapRef.current.currentPolygon!);
      onBoundaryChange(geoJSON);
    });

    // Clean up listener when polygon is no longer editable
    const editListener = mapRef.current.currentPolygon.addListener('editable_changed', () => {
      if (!mapRef.current.currentPolygon!.getEditable()) {
        window.google.maps.event.removeListener(listener);
        window.google.maps.event.removeListener(editListener);
        mapRef.current.currentPolygon!.setOptions(GOOGLE_MAPS_CONFIG.geofenceStyles.default);
      }
    });
  }, [readOnly, onBoundaryChange, polygonToGeoJSON]);

  // Load boundary when it changes
  useEffect(() => {
    if (mapLoaded && boundary) {
      loadExistingBoundary();
    }
  }, [mapLoaded, boundary, loadExistingBoundary]);

  // Auto-fit map to boundary when fitToBounds is true
  useEffect(() => {
    if (fitToBounds && boundary && mapRef.current.map) {
      // Small delay to ensure polygon is rendered
      const timer = setTimeout(() => {
        const bounds = new google.maps.LatLngBounds();
        
        // Get coordinates from GeoJSON
        if (boundary.type === 'Polygon') {
          const coordinates = boundary.coordinates[0];
          coordinates.forEach((coord: number[]) => {
            bounds.extend(new google.maps.LatLng(coord[1], coord[0]));
          });
        } else if (boundary.type === 'MultiPolygon') {
          // For MultiPolygon, use the first polygon
          const coordinates = boundary.coordinates[0][0];
          coordinates.forEach((coord: number[]) => {
            bounds.extend(new google.maps.LatLng(coord[1], coord[0]));
          });
        }
        
        // Fit map to bounds with padding
        if (bounds.isEmpty() === false) {
          mapRef.current.map.fitBounds(bounds, {
            padding: 50 // 50px padding
          });
        }
      }, 100); // 100ms delay
      
      return () => clearTimeout(timer);
    }
  }, [fitToBounds, boundary, mapLoaded]);

  // Check for API key
  useEffect(() => {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      setError('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file. Get your API key from: https://console.cloud.google.com/google/maps-apis');
    }
  }, []);

  if (error) {
    return (
      <div className="w-full" style={{ height }}>
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Loading Indicator */}
      {mapLoaded && !drawingLibraryLoaded && !readOnly && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <p className="text-sm text-yellow-800">
              Loading drawing tools...
            </p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {!readOnly && drawingLibraryLoaded && (
        <div className="mb-4">
          {!isDrawing ? (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={startDrawing}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              >
                Draw Polygon
              </Button>

              {mapRef.current.currentPolygon && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={editPolygon}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={clearBoundary}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    }
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click on the map to add points. Points added: {drawingPoints.length}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={completePolygon}
                  disabled={drawingPoints.length < 3}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                >
                  Complete Polygon
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={undoLastPoint}
                  disabled={drawingPoints.length === 0}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  }
                >
                  Undo Last Point
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={cancelDrawing}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!readOnly && drawingLibraryLoaded && !mapRef.current.currentPolygon && !isDrawing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Click "Draw Polygon" to start drawing a geofence boundary on the map.
          </p>
        </div>
      )}

      {/* Map Container */}
      <div 
        className="w-full border border-gray-300 rounded-md overflow-hidden"
        style={{ height }}
      >
        <GoogleMapReact
          bootstrapURLKeys={{
            key: GOOGLE_MAPS_CONFIG.apiKey,
            libraries: [...GOOGLE_MAPS_CONFIG.libraries]
          }}
          defaultCenter={center}
          defaultZoom={zoom}
          options={GOOGLE_MAPS_CONFIG.mapOptions}
          onGoogleApiLoaded={({ map }) => onMapLoad(map)}
          yesIWantToUseGoogleMapApiInternals
        />
      </div>

      {/* Boundary Info */}
      {mapRef.current.currentPolygon && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✓ Geofence boundary is set. {readOnly ? 'This is a read-only view.' : 'You can edit or clear the boundary using the buttons above.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default GeofenceMap;
