/**
 * Google Maps Configuration
 * Centralized configuration for Google Maps API settings
 */

export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyDakyL49GU8gPjnK0jihVQuRDxh6lTx-O8',
  defaultCenter: { lat: 27.7172, lng: 85.3240 }, // Kathmandu, Nepal
  defaultZoom: 12,
  libraries: ['drawing', 'geometry'] as const,
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: true,
    fullscreenControl: true,
  },
  drawingOptions: {
    // drawingMode, drawingControl, and drawingControlOptions will be set in component with proper enums
    polygonOptions: {
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: false,
      editable: true,
      zIndex: 1,
    },
  },
  geofenceStyles: {
    default: {
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    },
    selected: {
      fillColor: '#0000FF',
      fillOpacity: 0.3,
      strokeColor: '#0000FF',
      strokeOpacity: 1,
      strokeWeight: 3,
    },
    editing: {
      fillColor: '#00FF00',
      fillOpacity: 0.3,
      strokeColor: '#00FF00',
      strokeOpacity: 1,
      strokeWeight: 3,
    },
  },
} as const;

export type GoogleMapsConfig = typeof GOOGLE_MAPS_CONFIG;
// Drawing mode and control options are now handled in the component
export type Libraries = typeof GOOGLE_MAPS_CONFIG.libraries;