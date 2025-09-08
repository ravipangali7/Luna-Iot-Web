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

export interface UserVehicle {
  id: number;
  userId: number;
  vehicleId: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  satellite: number;
  realTimeGps: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Status {
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

export interface Vehicle {
  id: number;
  imei: string;
  name: string;
  vehicleNo: string;
  vehicleType: string;
  odometer: number;
  mileage: number;
  speedLimit: number;
  minimumFuel: number;
  createdAt: string;
  updatedAt: string;
  device?: Device | null;
  latestStatus?: Status | null;
  latestLocation?: Location | null;
  todayKm?: number;
  ownershipType?: string;
  userVehicle?: UserVehicle | null;
}

export interface VehicleFormData {
  imei: string;
  name: string;
  vehicleNo: string;
  vehicleType: string;
  odometer: number;
  mileage: number;
  speedLimit: number;
  minimumFuel: number;
}

export interface VehicleFilters {
  vehicleType?: string;
  status?: string;
}


export interface VehicleTableColumn {
  key: keyof Vehicle;
  label: string;
  sortable?: boolean;
}

export const VEHICLE_TYPES = [
  'Ambulance',
  'Bike',
  'Boat',
  'Bulldozer',
  'Bus',
  'Car',
  'Crane',
  'Cycle',
  'Dumper',
  'Garbage',
  'Jcb',
  'Jeep',
  'Mixer',
  'Mpv',
  'Pickup',
  'SchoolBus',
  'Suv',
  'Tanker',
  'Tempo',
  'Tractor',
  'Train',
  'Truck',
  'Van'
] as const;

export type VehicleType = typeof VEHICLE_TYPES[number];
