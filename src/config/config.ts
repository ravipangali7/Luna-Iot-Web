// API Configuration
export const API_CONFIG = {
    BASE_URL: 'http://5.189.159.178:7070', // Change this to your actual API URL
    // BASE_URL: 'https://system.mylunago.com', // Change this to your actual API URL
    TIMEOUT: 40000,
    ENDPOINTS: {
      AUTH: {
        LOGIN: '/api/auth/login/',
        REGISTER_SEND_OTP: '/api/auth/register/send-otp',
        REGISTER_VERIFY_OTP: '/api/auth/register/verify-otp',
        REGISTER_RESEND_OTP: '/api/auth/register/resend-otp',
        LOGOUT: '/api/auth/logout',
        GET_CURRENT_USER: '/api/auth/me',
        FORGOT_PASSWORD_SEND_OTP: '/api/auth/forgot-password/send-otp',
        FORGOT_PASSWORD_VERIFY_OTP: '/api/auth/forgot-password/verify-otp',
        FORGOT_PASSWORD_RESET: '/api/auth/forgot-password/reset-password',
      },
      FCM_TOKEN: '/api/fcm-token',
    },
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