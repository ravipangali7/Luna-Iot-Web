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
      '/share-track/'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
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
      const publicPaths = ['/alert-system/radar/token/', '/share-track/'];
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