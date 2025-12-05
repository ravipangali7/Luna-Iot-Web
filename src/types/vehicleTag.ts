export const RegisterType = {
  TRADITIONAL_OLD: 'traditional_old',
  TRADITIONAL_NEW: 'traditional_new',
  EMBOSSED: 'embossed',
} as const;

export type RegisterType = typeof RegisterType[keyof typeof RegisterType];

export const VehicleCategory = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  GOVERNMENT: 'government',
  DIPLOMATS: 'diplomats',
  NON_PROFIT_ORG: 'non_profit_org',
  CORPORATION: 'corporation',
  TOURISM: 'tourism',
  MINISTRY: 'ministry',
} as const;

export type VehicleCategory = typeof VehicleCategory[keyof typeof VehicleCategory];

export const AlertType = {
  WRONG_PARKING: 'wrong_parking',
  BLOCKING_ROAD: 'blocking_road',
  NOT_LOCKED_IGNITION_ON: 'not_locked_ignition_on',
  VEHICLE_TOW_ALERT: 'vehicle_tow_alert',
  TRAFFIC_RULE_VIOLATION: 'traffic_rule_violation',
  FIRE_PHYSICAL_THREAT: 'fire_physical_threat',
  ACCIDENT_ALERT: 'accident_alert',
} as const;

export type AlertType = typeof AlertType[keyof typeof AlertType];

export const AlertTypeLabels: Record<AlertType, string> = {
  [AlertType.WRONG_PARKING]: 'Wrong Parking',
  [AlertType.BLOCKING_ROAD]: 'Blocking The Road',
  [AlertType.NOT_LOCKED_IGNITION_ON]: 'Not Locked / Ignition ON',
  [AlertType.VEHICLE_TOW_ALERT]: 'Vehicle Tow Alert',
  [AlertType.TRAFFIC_RULE_VIOLATION]: 'Traffic Rule Violation',
  [AlertType.FIRE_PHYSICAL_THREAT]: 'Fire & Physical Threat',
  [AlertType.ACCIDENT_ALERT]: 'Accident Alert (Inform Family)',
};

export interface VehicleTagUserInfo {
  id: number;
  name: string | null;
  phone: string;
}

export interface VehicleTag {
  id: number;
  user: VehicleTagUserInfo | null;
  user_info: VehicleTagUserInfo | 'unassigned' | null;
  vtid: string;
  vehicle_model: string | null;
  registration_no: string | null;
  register_type: RegisterType | null;
  vehicle_category: VehicleCategory | null;
  sos_number: string | null;
  sms_number: string | null;
  is_active: boolean;
  is_downloaded: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleTagAlert {
  id: number;
  vehicle_tag: number;
  vehicle_tag_vtid: string;
  vehicle_tag_registration_no: string | null;
  latitude: number | null;
  longitude: number | null;
  person_image: string | null;
  alert: AlertType;
  alert_display: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleTagAlertCreateData {
  vtid: string;
  latitude: number;
  longitude: number;
  person_image: File;
  alert: AlertType;
}

export interface PaginationData {
  current_page: number;
  total_pages: number;
  total_items: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface VehicleTagListResponse {
  tags: VehicleTag[];
  pagination: PaginationData;
}

export interface VehicleTagAlertListResponse {
  alerts: VehicleTagAlert[];
  pagination: PaginationData;
}

