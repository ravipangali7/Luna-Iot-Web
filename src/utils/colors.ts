// Color utility functions
export const colors = {
    primary: '#4ade80',
    primaryLight: '#6ee7b7',
    primaryDark: '#22c55e',
    
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    secondary: '#6b7280',
    
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  };
  
  export const getColor = (colorName: keyof typeof colors) => colors[colorName];
  export const getGray = (shade: keyof typeof colors.gray) => colors.gray[shade];