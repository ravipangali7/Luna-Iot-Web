export interface SubscriptionPlanBasic {
  id: number;
  title: string;
  price: number;
  dealer_price?: number | null;
  purchasing_price?: number | null;
}

export interface DeviceOrderItem {
  id: number;
  subscription_plan: SubscriptionPlanBasic;
  subscription_plan_id?: number;
  price: number;
  quantity: number;
  total: number;
  created_at: string;
}

export interface DeviceOrder {
  id: number;
  user: number;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  status: 'accepted' | 'preparing' | 'dispatch';
  payment_status: 'pending' | 'failed' | 'completed';
  sub_total: number;
  is_vat: boolean;
  vat: number;
  total: number;
  items?: DeviceOrderItem[];
  items_count?: number;
  total_quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id?: number;
  subscription_plan_id: number;
  subscription_plan_title: string;
  quantity: number;
  price: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total_quantity: number;
  item_count: number;
}

export interface OrderFormData {
  items: Array<{
    subscription_plan: number;
    quantity: number;
  }>;
  is_vat: boolean;
}

export interface DeviceOrderListResponse {
  orders: DeviceOrder[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface OrderStatusUpdate {
  status: 'accepted' | 'preparing' | 'dispatch';
  payment_status?: 'pending' | 'failed' | 'completed';
}

