import axios from 'axios';
import { API_CONFIG } from '../config/config';

// API client with longer timeout for large responses
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 second timeout
  withCredentials: true,
  // Add retry logic for SSL certificate issues
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const phone = localStorage.getItem('phone');
    
    if (token && phone) {
      config.headers['x-token'] = token;
      config.headers['x-phone'] = phone;
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
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('phone');
      window.location.href = '/login';
    }
    
    // Handle network errors (including SSL certificate issues)
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CERT_COMMON_NAME_INVALID') {
      console.error('Network/SSL Error:', error.message);
      // You could implement a fallback here or show a user-friendly message
    }
    
    return Promise.reject(error);
  }
);