export interface User {
  id: number;
  name: string;
  phone: string;
  status: string;
  roles: {
    id: number;
    name: string;
    description: string;
  }[];
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

export interface Vehicle {
  id: number;
  imei: string;
  name: string;
  vehicleNo: string;
  vehicleType: string;
  userVehicles?: UserVehicle[];
}

export interface UserVehicle {
  id: number;
  userId: number;
  vehicleId: number;
  isMain: boolean;
  user?: User;
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
  image?: string;
  subscription_plan?: {
    id: number;
    title: string;
    price: number;
  } | null;
  userDevices: UserDevice[];
  vehicles?: Vehicle[];
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
  subscription_plan?: number | null;
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
