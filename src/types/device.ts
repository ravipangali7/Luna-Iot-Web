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

export interface DeviceStatus {
  id: number;
  imei: string;
  battery: number;
  signal: number;
  ignition: boolean;
  charging: boolean;
  relay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: number;
  imei: string;
  phone: string;
  serial_number: string | null;
  sim: string;
  protocol: string;
  iccid: string | null;
  model: string;
  type: string;
  status: string;
  image?: string;
  subscription_plan?: {
    id: number;
    title: string;
    price: number;
  } | null;
  userDevices: UserDevice[];
  vehicles?: Vehicle[];
  latestStatus?: DeviceStatus | null;
  simBalance?: import('./simBalance').SimBalanceSummary | null;
  latestRecharge?: {
    id: number;
    deviceId: number;
    amount: number;
    createdAt: string;
  } | null;
  institute?: {
    id: number;
    name: string;
    logo: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceFormData {
  imei: string;
  phone: string;
  serial_number?: string;
  sim: string;
  protocol: string;
  iccid: string;
  model: string;
  type: string;
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

// Device type constants
export const DEVICE_PROTOCOLS = {
  GT06: 'GT06',
  FMB003: 'FMB003',
  JT808_JT1078: 'JT808_JT1078',
} as const;

export const DEVICE_TYPES = {
  GPS: 'gps',
  BUZZER: 'buzzer',
  SOS: 'sos',
  DASHCAM: 'dashcam',
} as const;

export const DEVICE_MODELS = {
  EC08: 'EC08',
  VL149: 'VL149',
  T98_BSJ: 'T98_BSJ',
} as const;

export type DeviceProtocol = typeof DEVICE_PROTOCOLS[keyof typeof DEVICE_PROTOCOLS];
export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];
export type DeviceModel = typeof DEVICE_MODELS[keyof typeof DEVICE_MODELS];

// Dashcam-specific types
export interface DashcamConnection {
  imei: string;
  is_connected: boolean;
  last_heartbeat: string | null;
  connected_at: string | null;
  ip_address: string | null;
  is_streaming: boolean;
  stream_channel: number;
}

export interface DashcamDevice extends Device {
  connection?: DashcamConnection;
}

export interface DashcamCommandPayload {
  imei: string;
  action: 'server_point' | 'reset';
}

export interface DashcamStreamConfig {
  channel: 1 | 2;  // 1=Front, 2=Rear
  streamType: 0 | 1;  // 0=Main (HD), 1=Sub (SD)
}
