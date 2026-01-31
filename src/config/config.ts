import { GOOGLE_MAPS_CONFIG } from "./maps";

// API Configuration
export const API_CONFIG = {
    BASE_URL: 'https://python.mylunago.com',  
    SOCKET_URL: 'https://node.mylunago.com',
    // BASE_URL: 'http://38.54.71.218:7171/',  
    // SOCKET_URL: 'https://www.system.mylunago.com',
    
  } as const;
  
  // App Configuration
  export const APP_CONFIG = {
    NAME: 'Luna IOT Admin Dashboard',
    VERSION: '1.0.0',
    STORAGE_KEYS: {
      TOKEN: 'token',
      PHONE: 'phone',
      USER: 'user',
    },
  } as const;
  
  // UI Configuration
  export const UI_CONFIG = {
    THEME: {
      PRIMARY_COLOR: '#4ade80',
      SECONDARY_COLOR: '#6b7280',
      SUCCESS_COLOR: '#10b981',
      WARNING_COLOR: '#f59e0b',
      DANGER_COLOR: '#ef4444',
      INFO_COLOR: '#3b82f6',
    },
  } as const;

  // Maps Configuration
  export const MAPS_CONFIG = {
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_CONFIG.apiKey
  } as const;

  // Dashcam Configuration
  export const DASHCAM_CONFIG = {
    WS_URL: 'wss://python.mylunago.com',  // WebSocket for live streaming
  } as const;