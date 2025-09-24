// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyDakyL49GU8gPjnK0jihVQuRDxh6lTx-O8',
  libraries: ['geometry'] as const,
  defaultCenter: {
    lat: 28.3949, // Kathmandu, Nepal
    lng: 84.1240
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
