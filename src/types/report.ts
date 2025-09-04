export interface ReportStats {
  totalKm: number;
  totalTime: number; // in minutes
  averageSpeed: number;
  maxSpeed: number;
  totalIdleTime: number; // in minutes
  totalRunningTime: number; // in minutes
  totalOverspeedTime: number; // in minutes
  totalStopTime: number; // in minutes
}

export interface DailyData {
  date: string;
  averageSpeed: number;
  maxSpeed: number;
  totalKm: number;
  locationCount: number;
}

export interface LocationData {
  id: number;
  imei: string;
  latitude: string;
  longitude: string;
  speed: number;
  course: number;
  realTimeGps: boolean;
  satellite: number;
  createdAt: string;
}

export interface RawData {
  locations: LocationData[];
}

export interface ReportData {
  stats: ReportStats;
  dailyData: DailyData[];
  rawData: RawData;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
}
