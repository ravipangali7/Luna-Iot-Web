import type { Institute } from './institute';
import type { Vehicle } from './vehicle';

export interface GarbageVehicle {
  id: number;
  institute: Institute;
  institute_id?: number;
  vehicle: Vehicle;
  vehicle_id?: number;
  created_at: string;
  updated_at: string;
}

export interface GarbageVehicleFormData {
  institute: number;
  vehicle: number;
}

export interface GarbageVehicleList {
  id: number;
  institute_name: string;
  vehicle_name: string;
  vehicle_vehicle_no: string;
  created_at: string;
}

