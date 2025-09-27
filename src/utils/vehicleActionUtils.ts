import { showWarning } from './sweetAlert';
import type { Vehicle } from '../types/vehicle';

/**
 * Shows a warning modal when trying to perform actions on inactive vehicles
 */
export const showInactiveVehicleModal = (vehicle: Vehicle, action: string) => {
  showWarning(
    'Vehicle Inactive',
    `This vehicle (${vehicle.vehicleNo || vehicle.name}) is currently inactive and cannot perform the requested action: ${action}. Please activate the vehicle first.`
  );
};

/**
 * Checks if a vehicle action should be blocked due to inactive status
 */
export const shouldBlockAction = (vehicle: Vehicle): boolean => {
  return !vehicle.is_active;
};

/**
 * Wrapper function to handle vehicle actions with inactive check
 */
export const handleVehicleAction = (
  vehicle: Vehicle,
  action: string,
  actionCallback: () => void
) => {
  if (shouldBlockAction(vehicle)) {
    showInactiveVehicleModal(vehicle, action);
    return false; // Action was blocked
  } else {
    actionCallback();
    return true; // Action was allowed
  }
};

/**
 * Common vehicle actions that should check for inactive status
 */
export const VEHICLE_ACTIONS = {
  LIVE_TRACKING: 'Live Tracking',
  HISTORY: 'View History',
  REPORT: 'Generate Report',
  EDIT: 'Edit Vehicle',
  DELETE: 'Delete Vehicle',
  RECHARGE: 'Recharge Vehicle',
  SERVER_POINT: 'Send Server Point',
  RESET: 'Reset Device',
  GEOFENCE: 'Manage Geofence',
  SHARE_TRACKING: 'Share Tracking',
} as const;
