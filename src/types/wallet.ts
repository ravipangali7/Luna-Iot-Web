import type { Transaction } from './transaction';

export interface Wallet {
  id: number;
  balance: number;
  user: number;
  user_info: {
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
  };
  recent_transactions?: Transaction[];
  created_at: string;
  updated_at: string;
}

export interface WalletListItem {
  id: number;
  balance: number;
  user_name: string;
  user_phone: string;
  created_at: string;
}

export interface WalletBalanceUpdate {
  operation: 'add' | 'subtract' | 'set';
  amount: number;
  description?: string;
}

export interface WalletTopUpPayload {
  operation: 'add' | 'subtract';
  amount: number;
  description: string;
  performed_by_id?: number;
}
