import Battery0BarIcon from '@mui/icons-material/Battery0Bar';
import Battery1BarIcon from '@mui/icons-material/Battery1Bar';
import Battery2BarIcon from '@mui/icons-material/Battery2Bar';
import Battery3BarIcon from '@mui/icons-material/Battery3Bar';
import Battery4BarIcon from '@mui/icons-material/Battery4Bar';
import Battery5BarIcon from '@mui/icons-material/Battery5Bar';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';
import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar';
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellularOffIcon from '@mui/icons-material/SignalCellularOff';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsOffIcon from '@mui/icons-material/GpsOff';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';
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
  if (!vehicle.latestStatus && !vehicle.latestLocation) {
    return VehicleState.NO_DATA;
  }


  const status = vehicle.latestStatus;
  const location = vehicle.latestLocation;
  
  // Check if vehicle is inactive (no data for more than 30 minutes)
  if (status?.createdAt) {
    const now = new Date();
    const statusTime = new Date(status.createdAt);
    const diffMinutes = (now.getTime() - statusTime.getTime()) / (1000 * 60);

    if (diffMinutes > 720) {
      return VehicleState.INACTIVE;
    }
  }

  // Check if vehicle is stopped
  if (!status?.ignition) {
    return VehicleState.STOPPED;
  }

  // Check if vehicle is running
  if (status?.ignition && location && location.speed > 0) {
    // Check for overspeed
    if (vehicle.speedLimit && location.speed > vehicle.speedLimit) {
      return VehicleState.OVERSPEED;
    }
    return VehicleState.RUNNING;
  }

  // Check if vehicle is idle (ignition on but not moving or no location data)
  if (status?.ignition && (!location || location.speed === 0)) {
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

// Get very light state color for background
export const getStateBackgroundColor = (state: VehicleStateType): string => {
  switch (state) {
    case VehicleState.NO_DATA:
      return '#F5F5F5'; // Very light grey
    case VehicleState.INACTIVE:
      return '#E3F2FD'; // Very light blue
    case VehicleState.STOPPED:
      return '#FFEBEE'; // Very light red
    case VehicleState.IDLE:
      return '#FFFDE7'; // Very light gold/yellow
    case VehicleState.RUNNING:
      return '#E8F5E8'; // Very light green
    case VehicleState.OVERSPEED:
      return '#FFF3E0'; // Very light orange
    default:
      return '#F5F5F5'; // Very light grey
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

  // Map state names to actual file names
  const stateMap: Record<string, string> = {
    'no_data': 'nodata',
    'inactive': 'inactive',
    'stopped': 'stop',
    'idle': 'idle',
    'running': 'running',
    'overspeed': 'overspeed'
  };

  const mappedState = stateMap[state] || state;

  if (imageState === VehicleImageState.STATUS) {
    return `/assets/icon/${imgState}/${type}_${mappedState}.png`;
  } else {
    return `/assets/icon/${imgState}/live_${type}_${mappedState}.png`;
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


// Get time ago from UTC string (handles timezone properly)
export const getTimeAgoFromUTC = (utcString: string): string => {
  if (!utcString) return 'No data';

  const utcDate = new Date(utcString);
  const now = new Date();

  let diffInSeconds = Math.floor((now.getTime() - utcDate.getTime()) / 1000);

  if (diffInSeconds < 0) diffInSeconds = 0; // Prevent negative values

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

// Get Battery
export const getBattery = (value: number, size = 16) => {
  switch (value) {
    case 0:
      return <Battery0BarIcon style={{ fontSize: size, color: "red" }} />;
    case 1:
      return <Battery1BarIcon style={{ fontSize: size, color: "red" }} />;
    case 2:
      return <Battery2BarIcon style={{ fontSize: size, color: "redAccent" }} />;
    case 3:
      return <Battery3BarIcon style={{ fontSize: size, color: "yellow" }} />;
    case 4:
      return <Battery4BarIcon style={{ fontSize: size, color: "yellow" }} />;
    case 5:
      return <Battery5BarIcon style={{ fontSize: size, color: "green" }} />;
    case 6:
      return <BatteryFullIcon style={{ fontSize: size, color: "green" }} />;
    default:
      return <BatteryUnknownIcon style={{ fontSize: size, color: "grey" }} />;
  }
}

// Get Signal
export const getSignal = (value: number, size = 16) => {
  switch (value) {
    case 0:
      return <SignalCellularConnectedNoInternet0BarIcon style={{ fontSize: size, color: "red" }} />;
    case 1:
      return <SignalCellularAlt1BarIcon style={{ fontSize: size, color: "red" }} />;
    case 2:
      return <SignalCellularAlt2BarIcon style={{ fontSize: size, color: "yellow" }} />;
    case 3:
      return <SignalCellularAlt2BarIcon style={{ fontSize: size, color: "green" }} />;
    case 4:
      return <SignalCellularAltIcon style={{ fontSize: size, color: "green" }} />;
    default:
      return <SignalCellularOffIcon style={{ fontSize: size, color: "grey" }} />;
  }
}

// Get Satellite
export const getSatellite = (value: number, size = 16) => {
  if (value > 4) {
    return <GpsFixedIcon style={{ fontSize: size, color: "green" }} />;
  } else {
    return <GpsOffIcon style={{ fontSize: size, color: "grey" }} />;
  }
}

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
  getTimeAgoFromUTC,
  getBattery,
  getSignal,
  getSatellite,
  parseInt
};

export default VehicleUtils;