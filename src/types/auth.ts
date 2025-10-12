export interface Role {
  id: number;
  name: string;
  permissions: string[]; // Array of permission names
}
  
  export interface Permission {
    id: number;
    name: string;
    description?: string;
    content_type?: {
      app_label: string;
      model: string;
    };
  }
  
  export interface User {
    id: number;
    name: string;
    phone: string;
    status: string; // 'ACTIVE' or 'INACTIVE' (matches Django)
    role: string; // Primary role name for backward compatibility
    roles: Role[]; // All user groups (roles) with their permissions - matches Django groups
    permissions: string[]; // All permissions (group + direct)
    directPermissions: string[]; // Only direct user permissions
    availablePermissions?: Permission[]; // All available permissions for UI
    token?: string;
    fcmToken?: string; // camelCase to match Django
    email?: string;
    wallet?: {
      id: number;
      balance: number;
      created_at: string;
      updated_at: string;
    };
    createdAt: string;
    updatedAt: string;
  }
  
  export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    phone: string | null;
    isLoading: boolean;
  }
  
  export interface LoginCredentials {
    phone: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    name: string;
    phone: string;
    password: string;
    otp: string;
  }