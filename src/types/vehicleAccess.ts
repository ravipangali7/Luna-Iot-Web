export interface VehicleAccess {
  id: number;
  userId: number;
  vehicleId: number;
  imei: string;
  permissions: VehicleAccessPermissions;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    phone: string;
    email?: string;
    status: string;
    role: {
      id: number;
      name: string;
      description: string;
    };
  };
  vehicle?: {
    id: number;
    imei: string;
    name: string;
    vehicleNo: string;
    vehicleType: string;
  };
}

export interface VehicleAccessPermissions {
  allAccess: boolean;
  liveTracking: boolean;
  history: boolean;
  report: boolean;
  vehicleProfile: boolean;
  events: boolean;
  geofencing: boolean;
  troubleshoot: boolean;
  vehicleEdit: boolean;
  shareTracking: boolean;
}

export interface VehicleAccessFormData {
  userId: number;
  vehicleId: number;
  imei: string;
  permissions: VehicleAccessPermissions;
}

export interface VehicleAccessFilters {
  userId?: number;
  vehicleId?: number;
  imei?: string;
  search?: string;
}

export interface VehicleAccessTableColumn {
  key: keyof VehicleAccess;
  label: string;
  sortable?: boolean;
}

export const VEHICLE_ACCESS_PERMISSIONS = [
  { key: 'allAccess', label: 'All Access' },
  { key: 'liveTracking', label: 'Live Tracking' },
  { key: 'history', label: 'History' },
  { key: 'report', label: 'Report' },
  { key: 'vehicleProfile', label: 'Vehicle Profile' },
  { key: 'events', label: 'Events' },
  { key: 'geofencing', label: 'Geofencing' },
  { key: 'troubleshoot', label: 'Troubleshoot' },
  { key: 'vehicleEdit', label: 'Vehicle Edit' },
  { key: 'shareTracking', label: 'Share Tracking' },
] as const;

export type VehicleAccessPermissionKey = typeof VEHICLE_ACCESS_PERMISSIONS[number]['key'];
