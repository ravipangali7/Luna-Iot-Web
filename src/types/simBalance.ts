export interface SimFreeResource {
  id: number;
  name: string;
  resource_type: 'DATA' | 'SMS' | 'VOICE';
  remaining: string;
  expiry: string;
  created_at: string;
  updated_at: string;
}

export interface SimBalance {
  id: number;
  device?: {
    id: number;
    imei: string;
    phone: string;
    sim: string;
    protocol: string;
    iccid: string | null;
    model: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  device_id?: number | null;
  device_imei?: string | null;
  phone_number: string;
  state: string;
  balance: number;
  balance_expiry: string | null;
  last_synced_at: string;
  free_resources: SimFreeResource[];
  created_at: string;
  updated_at: string;
}

export interface SimBalanceImportResult {
  success: boolean;
  total_rows: number;
  successful: number;
  failed: number;
  errors?: string[];
  error?: string;
}

export interface SimBalanceFilters {
  phone_number?: string;
  state?: string;
  device_id?: number;
  min_balance?: number;
  max_balance?: number;
  expiry_before?: string;
  expiry_after?: string;
}

export interface SimBalancePaginationResponse {
  sim_balances: SimBalance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Summary version used in vehicle/device responses
export interface SimBalanceSummary {
  id: number;
  phone_number: string;
  balance: number;
  balance_expiry: string | null;
  last_synced_at: string;
  state: string;
  free_resources_summary: Array<{
    name: string;
    type: string;
    remaining: string;
    expiry: string;
  }>;
}

