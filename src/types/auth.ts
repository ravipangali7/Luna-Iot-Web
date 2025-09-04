export interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
  }
  
  export interface Permission {
    id: number;
    name: string;
    description: string;
  }
  
  export interface User {
    id: number;
    name: string;
    phone: string;
    status: string;
    role: Role;
    token?: string;
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