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
        
        // Debug logging for vehicle tag history endpoint
        if (url.includes('/api/vehicle-tag/history/')) {
          console.log('[API Client] Adding auth headers for vehicle tag history:', {
            url,
            hasToken: !!token,
            hasPhone: !!phone,
          });
        }
      } else {
        // Debug logging when credentials are missing
        if (url.includes('/api/vehicle-tag/history/')) {
          console.warn('[API Client] Missing credentials for vehicle tag history:', {
            url,
            hasToken: !!token,
            hasPhone: !!phone,
          });
        }
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
      const requestUrl = error.config?.url || '';
      const errorMessage = error.response?.data?.message || '';
      
      // Debug logging
      console.log('[API Client] 401 error received:', {
        url: requestUrl,
        pathname: window.location.pathname,
        errorMessage,
        hasTokenInStorage: !!localStorage.getItem('token'),
        hasPhoneInStorage: !!localStorage.getItem('phone'),
      });
      
      // Don't redirect if we're on a public page
      const publicPaths = ['/alert-system/radar/token/', '/share-track/', '/vehicle-tag/alert/'];
      const isPublicPath = publicPaths.some(path => 
        window.location.pathname.includes(path)
      );
      
      if (isPublicPath) {
        console.log('[API Client] Public path detected, not logging out');
        return Promise.reject(error);
      }
      
      // Check localStorage directly (more reliable than checking error.config.headers)
      // This tells us if we had credentials when the error occurred
      const hasTokenInStorage = !!localStorage.getItem('token');
      const hasPhoneInStorage = !!localStorage.getItem('phone');
      const hadCredentials = hasTokenInStorage && hasPhoneInStorage;
      
      // Check if the request was to a protected endpoint (should have had auth headers)
      const isProtectedEndpoint = !requestUrl.includes('/api/core/auth/') && 
                                   !requestUrl.includes('/api/vehicle-tag/alert/') &&
                                   !requestUrl.match(/\/api\/vehicle-tag\/[^\/]+\/(latest-alert\/|qr\/)$/) &&
                                   !requestUrl.match(/\/api\/vehicle-tag\/[^\/]+\/$/);
      
      // Only log out on actual authentication failures
      // Authentication failures: "Invalid token", "Phone and token required", "User matching query does not exist"
      // Permission issues should return 403, but if we get 401 with "Access denied" or similar, don't log out
      const isAuthFailure = 
        errorMessage.includes('Invalid token') ||
        errorMessage.includes('Phone and token required') ||
        errorMessage.includes('User matching query does not exist') ||
        errorMessage.includes('Authentication required') ||
        (isProtectedEndpoint && !hadCredentials && errorMessage.includes('token'));
      
      // If it's not a clear authentication failure, don't log out
      // This could be a permission issue, network error, or other problem
      if (!isAuthFailure) {
        console.warn('[API Client] 401 error but not logging out - may be permission or other issue:', {
          errorMessage,
          hadCredentials,
          isProtectedEndpoint,
          url: requestUrl,
        });
        return Promise.reject(error);
      }
      
      // Only log out on clear authentication failures
      console.warn('[API Client] Authentication failed, logging out:', {
        errorMessage,
        url: requestUrl,
        hadCredentials,
      });
      localStorage.removeItem('token');
      localStorage.removeItem('phone');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);