export interface SubscriptionPlan {
  id: number;
  title: string;
  price: number;
  dealer_price?: number | null;
  permissions?: SubscriptionPlanPermission[]; // Optional for list view
  permissions_count?: number; // For list view
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanPermission {
  id: number;
  permission: number;
  permission_name: string;
  permission_codename: string;
  created_at: string;
}

export interface SubscriptionPlanFormData {
  title: string;
  price: number;
  dealer_price?: number | null;
  permission_ids: number[];
}

export interface SubscriptionPlanListResponse {
  subscription_plans: SubscriptionPlan[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: string;
}
