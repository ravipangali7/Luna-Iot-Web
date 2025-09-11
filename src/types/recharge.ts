export interface Device {
  id: number;
  imei: string;
  phone: string;
  sim: string;
  protocol: string;
  iccid: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  userDevices?: {
    id: number;
    userId: number;
    deviceId: number;
    user: {
      id: number;
      name: string;
      phone: string;
      status: string;
      role: {
        id: number;
        name: string;
        description: string;
      };
    };
  }[];
  vehicles?: {
    id: number;
    imei: string;
    name: string;
    vehicleNo: string;
    vehicleType: string;
    userVehicles?: {
      id: number;
      userId: number;
      vehicleId: number;
      user: {
        id: number;
        name: string;
        phone: string;
        status: string;
        role: {
          id: number;
          name: string;
          description: string;
        };
      };
    }[];
  }[];
}

export interface Recharge {
  id: number;
  deviceId: number;
  amount: number;
  createdAt: string;
  device: Device;
  topupResult?: {
    success: boolean;
    message: string;
    simType: string;
    reference: string;
    statusCode: number;
    state: string;
    creditsConsumed: number;
    creditsAvailable: number;
    transactionId: number | null;
  };
}

export interface RechargeFormData {
  deviceId: number;
  amount: number;
}

export interface RechargeFilters {
  deviceId?: number;
  amountMin?: number;
  amountMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface RechargeStats {
  totalAmount: number;
  totalCount: number;
  minAmount: number;
  maxAmount: number;
}

export interface RechargePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RechargeResponse {
  recharges: Recharge[];
  pagination: RechargePagination;
}

export interface RechargeTableColumn {
  key: keyof Recharge;
  label: string;
  sortable?: boolean;
}
