export interface History {
  imei: string;
  type: 'location' | 'status';
  dataType: 'location' | 'status';
  createdAt?: string;
  
  // Location fields
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  realTimeGps?: boolean;
  satellite?: number;
  
  // Status fields
  ignition?: boolean;
}

export interface HistoryFilters {
  startDate: string;
  endDate: string;
}

export interface Trip {
  tripNumber: number;
  startTime: string;
  endTime: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  distance: number;
  duration: number; // in minutes
  tripPoints: History[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  currentDateTime?: string;
  currentSpeed: number;
  progress: number;
}
