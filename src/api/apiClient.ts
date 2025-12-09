import axios from 'axios';
import { API_CONFIG } from '../config/config';

// API client with longer timeout for large responses
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable cookies/session for cart functionality
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    // Skip auth headers for public endpoints
    const publicEndpoints = [
      '/api/alert-system/alert-radar/token/',
      '/api/alert-system/alert-history/by-radar/',
      '/share-track/',
      '/api/vehicle-tag/alert/',  // Vehicle tag alert creation (public)
    ];
    
    // Check if this is a public vehicle tag endpoint
    // Public endpoints: get tag by VTID, get latest alert, get QR code, create alert
    const url = config.url || '';
    const isVehicleTagPublicEndpoint = url.includes('/api/vehicle-tag/') && (
      url.includes('/alert/') ||  // Alert creation endpoint (e.g., /api/vehicle-tag/alert/)
      // Match any VTID format followed by: /, /latest-alert/, or /qr/
      // Examples: /api/vehicle-tag/VTID84/, /api/vehicle-tag/VTID84/latest-alert/, /api/vehicle-tag/VTID84/qr/
      /\/api\/vehicle-tag\/[^\/]+\/(latest-alert\/|qr\/)$/.test(url) ||  // Matches /latest-alert/ or /qr/
      /\/api\/vehicle-tag\/[^\/]+\/$/.test(url)  // Matches trailing slash (get tag by VTID)
    );
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      url.includes(endpoint)
    ) || isVehicleTagPublicEndpoint;
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('token');
      const phone = localStorage.getItem('phone');
      
      if (token && phone) {
        config.headers['x-token'] = token;
        config.headers['x-phone'] = phone;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're on a public page
      const publicPaths = ['/alert-system/radar/token/', '/share-track/', '/vehicle-tag/alert/'];
      const isPublicPath = publicPaths.some(path => 
        window.location.pathname.includes(path)
      );
      
      if (!isPublicPath) {
        localStorage.removeItem('token');
        localStorage.removeItem('phone');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);