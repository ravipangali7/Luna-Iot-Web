// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyC4oO2oBMNzhEhLCmD2i9Ts9ljplYpsCVg',
  libraries: ['geometry'] as const,
  defaultCenter: {
    lat: 27.7172, // Kathmandu, Nepal
    lng: 85.3240
  },
  defaultZoom: 15,
  mapTypes: {
    roadmap: 'roadmap',
    satellite: 'satellite',
    hybrid: 'hybrid',
    terrain: 'terrain'
  }
};

// Map styling options
export const MAP_STYLES = {
  default: [],
  dark: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ light: -80 }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }]
    }
  ]
};
