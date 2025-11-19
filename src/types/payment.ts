export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'ERROR' | 'CANCELLED';

export interface PaymentTransaction {
  id: number;
  user: number;
  user_name: string;
  user_phone: string;
  wallet: number;
  txn_id: string;
  reference_id: string;
  amount: number;
  amount_paisa: number;
  status: PaymentStatus;
  status_display: string;
  connectips_txn_id?: number | null;
  connectips_batch_id?: number | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface PaymentInitiateRequest {
  amount: number; // Amount in NPR
  remarks?: string;
  particulars?: string;
}

export interface PaymentFormData {
  MERCHANTID: string;
  APPID: string;
  APPNAME: string;
  TXNID: string;
  TXNDATE: string;
  TXNCRNCY: string;
  TXNAMT: string;
  REFERENCEID: string;
  REMARKS: string;
  PARTICULARS: string;
  TOKEN: string;
  gateway_url: string;
  success_url: string;
  failure_url: string;
}

export interface PaymentCallbackParams {
  txn_id?: string;
  status?: 'success' | 'failure';
}

export interface PaymentValidateRequest {
  txn_id: string;
}

