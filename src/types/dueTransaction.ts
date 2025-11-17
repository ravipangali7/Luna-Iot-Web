export interface DueTransactionParticular {
  id: number;
  particular: string;
  type: 'vehicle' | 'parent';
  institute?: number | null;
  institute_name?: string;
  amount: number;
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
  subtotal: number;
  vat: number;
  total: number;
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

