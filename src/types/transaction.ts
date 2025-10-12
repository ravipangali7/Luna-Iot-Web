export interface Transaction {
  id: number;
  wallet: number;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  balance_before: number;
  balance_after: number;
  description: string;
  performed_by: {
    id: number;
    name: string;
    phone: string;
  } | null;
  transaction_reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface TransactionListItem {
  id: number;
  user_name: string;
  user_phone: string;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  transaction_type_display: string;
  balance_after: number;
  description: string;
  performed_by_name: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  status_display: string;
  created_at: string;
}

export interface TransactionFilter {
  wallet_id?: number;
  user_id?: number;
  transaction_type?: 'CREDIT' | 'DEBIT';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TransactionSummary {
  total_transactions: number;
  total_credit: number;
  total_debit: number;
  net_change: number;
  pending_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  date_range_days: number;
}

export interface WalletTopUpPayload {
  operation: 'add' | 'subtract';
  amount: number;
  description: string;
  performed_by_id?: number;
}

export interface TransactionCreatePayload {
  wallet_id: number;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  description: string;
  performed_by_id?: number;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
}
