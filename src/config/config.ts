// API Configuration
export const API_CONFIG = {
    BASE_URL: 'http://38.54.71.218:7070',
    // BASE_URL: 'https://system.mylunago.com', 
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