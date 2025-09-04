export interface User {
  id: number;
  name: string;
  phone: string;
  status: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserDevice {
  id: number;
  userId: number;
  deviceId: number;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: number;
  imei: string;
  phone: string;
  sim: string;
  protocol: string;
  iccid: string | null;
  model: string;
  status: string;
  userDevices: UserDevice[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceFormData {
  imei: string;
  phone: string;
  sim: string;
  protocol: string;
  iccid: string;
  model: string;
}

export interface DeviceFilters {
  search?: string;
  sim?: string;
  protocol?: string;
  model?: string;
}

export interface DeviceTableColumn {
  key: keyof Device;
  label: string;
  sortable?: boolean;
}
