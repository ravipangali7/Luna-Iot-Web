export interface LunaTag {
  id: number;
  publicKey: string;
  is_lost_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLunaTag {
  id: number;
  publicKey: number; // FK to LunaTag
  publicKey_value?: string; // The actual publicKey string value
  name: string;
  image?: string | null;
  expire_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LunaTagData {
  id: number;
  publicKey: number; // FK to LunaTag
  publicKey_value?: string; // The actual publicKey string value
  battery?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LunaTagFormData {
  publicKey: string;
  is_lost_mode?: boolean;
}

export interface UserLunaTagFormData {
  publicKey: string;
  name: string;
  image?: File | string | null;
  expire_date?: string | null;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };
}

