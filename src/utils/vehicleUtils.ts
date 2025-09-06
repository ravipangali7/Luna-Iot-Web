// Vehicle utilities for web application
// Based on vehicle_service.dart and vehicle_image_state.dart from Flutter app

import type { Vehicle } from '../types/vehicle';

export interface VehicleStatus {
  imei: string;
  battery: number;
  signal: number;
  charging: boolean;
  ignition: boolean;
  relay: boolean;
  createdAt: Date;
}

export interface VehicleLocation {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  realTimeGps: boolean;
  satellite: number;
  createdAt: Date;
}

export const VehicleState = {
  NO_DATA: 'no_data',
  INACTIVE: 'inactive',
  STOPPED: 'stopped',
  IDLE: 'idle',
  RUNNING: 'running',
  OVERSPEED: 'overspeed'
} as const;

export const VehicleImageState = {
  STATUS: 'status',
  LIVE: 'live'
} as const;

export type VehicleStateType = typeof VehicleState[keyof typeof VehicleState];
export type VehicleImageStateType = typeof VehicleImageState[keyof typeof VehicleImageState];

// Color constants
const NO_DATA_COLOR = '#9E9E9E';
const INACTIVE_COLOR = '#FF9800';
const STOPPED_COLOR = '#F44336';
const IDLE_COLOR = '#FFC107';
const RUNNING_COLOR = '#4CAF50';
const OVERSPEED_COLOR = '#E91E63';

// Get vehicle state
export const getState = (vehicle: Vehicle): VehicleStateType => {
  if (!vehicle.latestStatus) {
    return VehicleState.NO_DATA;
  }

  const status = vehicle.latestStatus;
  const location = vehicle.latestLocation;

  // Check if vehicle is inactive (no data for more than 30 minutes)
  if (status.createdAt) {
    const now = new Date();
    const statusTime = new Date(status.createdAt);
    const diffMinutes = (now.getTime() - statusTime.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30) {
      return VehicleState.INACTIVE;
    }
  }

  // Check if vehicle is stopped
  if (!status.ignition) {
    return VehicleState.STOPPED;
  }

  // Check if vehicle is running
  if (status.ignition && location && location.speed > 0) {
    // Check for overspeed
    if (vehicle.speedLimit && location.speed > vehicle.speedLimit) {
      return VehicleState.OVERSPEED;
    }
    return VehicleState.RUNNING;
  }

  // Check if vehicle is idle (ignition on but not moving)
  if (status.ignition && location && location.speed === 0) {
    return VehicleState.IDLE;
  }

  return VehicleState.NO_DATA;
};

// Get state color
export const getStateColor = (state: VehicleStateType): string => {
  switch (state) {
    case VehicleState.NO_DATA:
      return NO_DATA_COLOR;
    case VehicleState.INACTIVE:
      return INACTIVE_COLOR;
    case VehicleState.STOPPED:
      return STOPPED_COLOR;
    case VehicleState.IDLE:
      return IDLE_COLOR;
    case VehicleState.RUNNING:
      return RUNNING_COLOR;
    case VehicleState.OVERSPEED:
      return OVERSPEED_COLOR;
    default:
      return NO_DATA_COLOR;
  }
};

// Get image path
export const getImagePath = (
  vehicleType: string,
  vehicleState: VehicleStateType,
  imageState: VehicleImageStateType
): string => {
  const type = vehicleType.toLowerCase();
  const state = vehicleState.toLowerCase();
  const imgState = imageState.toLowerCase();
  
  if (imageState === VehicleImageState.STATUS) {
    return `/src/assets/icon/${imgState}/${type}_${state}.png`;
  } else {
    return `/src/assets/icon/${imgState}/${type}_${state}.png`;
  }
};

// Get display speed
export const getDisplaySpeed = (vehicle: Vehicle, state: VehicleStateType): string => {
  if (state === VehicleState.NO_DATA || state === VehicleState.INACTIVE) {
    return '0';
  }
  
  const speed = vehicle.latestLocation?.speed || 0;
  return speed.toString();
};

// Get fuel consumption
export const getFuelConsumption = (todayKm: number, mileage: number): number => {
  if (mileage <= 0) return 0;
  return todayKm / mileage;
};

// Get time ago
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

// Get satellite color
export const getSatelliteColor = (satellite: number): string => {
  if (satellite >= 4) return '#4CAF50';
  if (satellite >= 2) return '#FF9800';
  return '#F44336';
};

// Get satellite icon
export const getSatelliteIcon = (satellite: number): string => {
  if (satellite >= 4) return '🛰️';
  if (satellite >= 2) return '📡';
  return '📶';
};

// Get battery color
export const getBatteryColor = (battery: number): string => {
  if (battery >= 80) return '#4CAF50';
  if (battery >= 50) return '#FF9800';
  if (battery >= 20) return '#FFC107';
  return '#F44336';
};

// Get battery icon
export const getBatteryIcon = (battery: number): string => {
  if (battery >= 80) return '🔋';
  if (battery >= 50) return '🔋';
  if (battery >= 20) return '🔋';
  return '🔋';
};

// Get signal color
export const getSignalColor = (signal: number): string => {
  if (signal >= 4) return '#4CAF50';
  if (signal >= 2) return '#FF9800';
  return '#F44336';
};

// Get signal icon
export const getSignalIcon = (signal: number): string => {
  if (signal >= 4) return '📶';
  if (signal >= 2) return '📶';
  return '📶';
};

// Parse integer safely
export const parseInt = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
};

// Default export with all functions
const VehicleUtils = {
  getState,
  getStateColor,
  getImagePath,
  getDisplaySpeed,
  getFuelConsumption,
  getTimeAgo,
  getSatelliteColor,
  getSatelliteIcon,
  getBatteryColor,
  getBatteryIcon,
  getSignalColor,
  getSignalIcon,
  parseInt
};

export default VehicleUtils;