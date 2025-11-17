import type { User } from './auth';
import type { Vehicle } from './vehicle';

export interface Institute {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolBus {
  id: number;
  institute: Institute;
  institute_id?: number;
  bus: Vehicle;
  bus_id?: number;
  created_at: string;
  updated_at: string;
}

export interface SchoolBusFormData {
  institute: number;
  bus: number;
}

export interface SchoolBusList {
  id: number;
  institute_name: string;
  bus_name: string;
  bus_vehicle_no: string;
  created_at: string;
}

export interface SchoolParent {
  id: number;
  parent: User;
  parent_id?: number;
  school_buses: number[];
  latitude?: number;
  longitude?: number;
  child_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolParentFormData {
  parent: number;
  school_buses: number[];
  latitude?: number;
  longitude?: number;
  child_name?: string;
}

export interface SchoolParentList {
  id: number;
  parent_name: string;
  parent_phone: string;
  school_buses_count: number;
  latitude?: number;
  longitude?: number;
  child_name?: string;
  created_at: string;
}

export interface SchoolSMS {
  id: number;
  message: string;
  institute: Institute;
  institute_id?: number;
  phone_numbers: string[];
  created_at: string;
  updated_at: string;
}

export interface SchoolSMSFormData {
  message: string;
  institute: number;
  phone_numbers: string[];
}

export interface SchoolSMSList {
  id: number;
  institute_name: string;
  message_preview: string;
  phone_numbers_count: number;
  created_at: string;
}

