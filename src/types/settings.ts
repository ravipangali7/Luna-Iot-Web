/**
 * Settings Type Definitions
 */

export interface MySetting {
  id: number;
  mypay_balance: number;
  vat_percent: number;
  call_price: number;
  sms_price: number;
  parent_price: number;
  created_at: string;
  updated_at: string;
}

export interface MySettingUpdate {
  mypay_balance?: number;
  vat_percent?: number;
  call_price?: number;
  sms_price?: number;
  parent_price?: number;
}

