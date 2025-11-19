export interface DueTransactionParticular {
  id: number;
  particular: string;
  type: 'vehicle' | 'parent';
  institute?: number | null;
  institute_name?: string;
  vehicle?: number | null;
  vehicle_id?: number | null;
  vehicle_info?: {
    id: number;
    imei: string;
    name: string;
    vehicleNo: string;
  } | null;
  amount: number;
  dealer_amount?: number | null;
  display_amount?: number;
  is_dealer_view?: boolean;
  quantity: number;
  total: number;
  created_at: string;
}

export interface DueTransaction {
  id: number;
  user: number;
  user_info: {
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
  };
  paid_by?: number | null;
  paid_by_info?: {
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
  } | null;
  subtotal: number;
  vat: number;
  total: number;
  display_subtotal?: number;
  display_vat?: number | null;
  display_total?: number;
  show_vat?: boolean;
  show_dealer_price?: boolean;
  renew_date: string;
  expire_date: string;
  is_paid: boolean;
  pay_date?: string | null;
  particulars: DueTransactionParticular[];
  created_at: string;
  updated_at: string;
}

export interface DueTransactionListItem {
  id: number;
  user: number;
  user_name: string;
  user_phone: string;
  subtotal: number;
  vat: number;
  total: number;
  display_total?: number;
  show_vat?: boolean;
  renew_date: string;
  expire_date: string;
  is_paid: boolean;
  pay_date?: string | null;
  particulars_count: number;
  created_at: string;
}

export interface DueTransactionCreate {
  user: number;
  subtotal: number;
  vat?: number;
  total?: number;
  renew_date: string;
  expire_date: string;
  particulars: DueTransactionParticularCreate[];
}

export interface DueTransactionParticularCreate {
  particular: string;
  type: 'vehicle' | 'parent';
  institute?: number | null;
  amount: number;
  quantity: number;
}

