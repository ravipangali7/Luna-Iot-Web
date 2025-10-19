import { apiClient } from '../apiClient';

// ===== TYPES =====

export interface AlertType {
  id: number;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertGeofence {
  id: number;
  title: string;
  alert_types: number[];
  alert_types_names: string[];
  boundary: string; // GeoJSON string
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface AlertRadar {
  id: number;
  title: string;
  token: string;
  alert_geofences: { id: number; title: string }[];
  alert_geofences_names: string[];
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface AlertBuzzer {
  id: number;
  title: string;
  device: number;
  device_imei: string;
  device_phone: string;
  delay: number;
  alert_geofences: { id: number; title: string }[];
  alert_geofences_names: string[];
  geofences_count: number;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface AlertContact {
  id: number;
  name: string;
  phone: string;
  alert_geofences: { id: number; title: string }[];
  alert_geofences_names: string[];
  alert_types: { id: number; name: string; icon: string | null }[];
  alert_types_names: string[];
  is_sms: boolean;
  is_call: boolean;
  institute: number;
  institute_name: string;
  geofences_count?: number;
  alert_types_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AlertSwitch {
  id: number;
  title: string;
  device: number;
  device_imei: string;
  device_phone: string;
  latitude: number;
  longitude: number;
  trigger: number;
  primary_phone: string;
  secondary_phone: string;
  image: string | null;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: number;
  source: string;
  name: string;
  primary_phone: string;
  alert_type: number;
  alert_type_name: string;
  status: string;
  datetime: string;
  remarks: string;
  image: string | null;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

// ===== CREATE/UPDATE INTERFACES =====

export interface AlertTypeCreate {
  name: string;
  icon?: string;
}

export interface AlertTypeUpdate {
  name?: string;
  icon?: string;
}

export interface AlertGeofenceCreate {
  title: string;
  alert_types: number[];
  boundary: string;
  institute: number;
}

export interface AlertGeofenceUpdate {
  title?: string;
  alert_types?: number[];
  boundary?: string;
}

export interface AlertRadarCreate {
  title: string;
  token?: string;
  geofence_ids: number[];
  institute: number;
}

export interface AlertRadarUpdate {
  title?: string;
  token?: string;
  geofence_ids?: number[];
}

export interface AlertBuzzerCreate {
  title: string;
  device: number;
  delay: number;
  geofence_ids: number[];
  institute: number;
}

export interface AlertBuzzerUpdate {
  title?: string;
  device?: number;
  delay?: number;
  geofence_ids?: number[];
}

export interface AlertContactCreate {
  name: string;
  phone: string;
  geofence_ids: number[];
  alert_type_ids: number[];
  is_sms: boolean;
  is_call: boolean;
  institute: number;
}

export interface AlertContactUpdate {
  name?: string;
  phone?: string;
  geofence_ids?: number[];
  alert_type_ids?: number[];
  is_sms?: boolean;
  is_call?: boolean;
}

export interface AlertSwitchCreate {
  title: string;
  device: number;
  latitude: number;
  longitude: number;
  trigger: number;
  primary_phone: string;
  secondary_phone: string;
  image?: File | null;
  institute: number;
}

export interface AlertSwitchUpdate {
  title?: string;
  device?: number;
  latitude?: number;
  longitude?: number;
  trigger?: number;
  primary_phone?: string;
  secondary_phone?: string;
  image?: File | null;
}

export interface AlertHistoryStatusUpdate {
  status: string;
}

export interface AlertHistoryRemarksUpdate {
  remarks: string;
}

// ===== API RESPONSE TYPES =====

export interface AlertSystemApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  };
}

// ===== ALERT TYPE API =====

export const alertTypeService = {
  getAll: async (): Promise<AlertType[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertType[]>>('/api/alert-system/alert-type/');
    return response.data.data;
  },

  getById: async (id: number): Promise<AlertType> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertType>>(`/api/alert-system/alert-type/${id}/`);
    return response.data.data;
  },

  create: async (data: AlertTypeCreate): Promise<AlertType> => {
    const response = await apiClient.post<AlertSystemApiResponse<AlertType>>('/api/alert-system/alert-type/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: AlertTypeUpdate): Promise<AlertType> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertType>>(`/api/alert-system/alert-type/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-type/${id}/delete/`);
  }
};

// ===== ALERT GEOFENCE API =====

export const alertGeofenceService = {
  getAll: async (): Promise<AlertGeofence[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertGeofence[]>>('/api/alert-system/alert-geofence/');
    return response.data.data;
  },

  getById: async (id: number): Promise<AlertGeofence> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertGeofence>>(`/api/alert-system/alert-geofence/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<AlertGeofence[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertGeofence[]>>(`/api/alert-system/alert-geofence/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: AlertGeofenceCreate): Promise<AlertGeofence> => {
    const response = await apiClient.post<AlertSystemApiResponse<AlertGeofence>>('/api/alert-system/alert-geofence/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: AlertGeofenceUpdate): Promise<AlertGeofence> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertGeofence>>(`/api/alert-system/alert-geofence/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-geofence/${id}/delete/`);
  }
};

// ===== ALERT RADAR API =====

export const alertRadarService = {
  getAll: async (): Promise<AlertRadar[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertRadar[]>>('/api/alert-system/alert-radar/');
    return response.data.data;
  },

  getById: async (id: number): Promise<AlertRadar> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertRadar>>(`/api/alert-system/alert-radar/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<AlertRadar[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertRadar[]>>(`/api/alert-system/alert-radar/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: AlertRadarCreate): Promise<AlertRadar> => {
    const response = await apiClient.post<AlertSystemApiResponse<AlertRadar>>('/api/alert-system/alert-radar/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: AlertRadarUpdate): Promise<AlertRadar> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertRadar>>(`/api/alert-system/alert-radar/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-radar/${id}/delete/`);
  }
};

// ===== ALERT BUZZER API =====

export const alertBuzzerService = {
  getAll: async (): Promise<AlertBuzzer[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertBuzzer[]>>('/api/alert-system/alert-buzzer/');
    return response.data.data;
  },

  getById: async (id: number): Promise<AlertBuzzer> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertBuzzer>>(`/api/alert-system/alert-buzzer/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<AlertBuzzer[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertBuzzer[]>>(`/api/alert-system/alert-buzzer/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: AlertBuzzerCreate): Promise<AlertBuzzer> => {
    const response = await apiClient.post<AlertSystemApiResponse<AlertBuzzer>>('/api/alert-system/alert-buzzer/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: AlertBuzzerUpdate): Promise<AlertBuzzer> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertBuzzer>>(`/api/alert-system/alert-buzzer/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-buzzer/${id}/delete/`);
  }
};

// ===== ALERT CONTACT API =====

export const alertContactService = {
  getAll: async (): Promise<AlertContact[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertContact[]>>('/api/alert-system/alert-contact/');
    return response.data.data;
  },

  getById: async (id: number): Promise<AlertContact> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertContact>>(`/api/alert-system/alert-contact/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<AlertContact[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertContact[]>>(`/api/alert-system/alert-contact/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: AlertContactCreate): Promise<AlertContact> => {
    const response = await apiClient.post<AlertSystemApiResponse<AlertContact>>('/api/alert-system/alert-contact/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: AlertContactUpdate): Promise<AlertContact> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertContact>>(`/api/alert-system/alert-contact/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-contact/${id}/delete/`);
  }
};

// ===== ALERT SWITCH API =====

export const alertSwitchService = {
  getAll: async (): Promise<AlertSwitch[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertSwitch[]>>('/api/alert-system/alert-switch/');
    return response.data.data;
  },

  getById: async (id: number): Promise<AlertSwitch> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertSwitch>>(`/api/alert-system/alert-switch/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<AlertSwitch[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertSwitch[]>>(`/api/alert-system/alert-switch/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: AlertSwitchCreate): Promise<AlertSwitch> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('device', data.device.toString());
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    formData.append('trigger', data.trigger.toString());
    formData.append('primary_phone', data.primary_phone);
    formData.append('secondary_phone', data.secondary_phone);
    formData.append('institute', data.institute.toString());
    
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiClient.post<AlertSystemApiResponse<AlertSwitch>>('/api/alert-system/alert-switch/create/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  update: async (id: number, data: AlertSwitchUpdate): Promise<AlertSwitch> => {
    const formData = new FormData();
    
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.device !== undefined) formData.append('device', data.device.toString());
    if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
    if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
    if (data.trigger !== undefined) formData.append('trigger', data.trigger.toString());
    if (data.primary_phone !== undefined) formData.append('primary_phone', data.primary_phone);
    if (data.secondary_phone !== undefined) formData.append('secondary_phone', data.secondary_phone);
    
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiClient.put<AlertSystemApiResponse<AlertSwitch>>(`/api/alert-system/alert-switch/${id}/update/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-switch/${id}/delete/`);
  }
};

// ===== ALERT HISTORY API =====

export const alertHistoryService = {
  getAll: async (): Promise<AlertHistory[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<{histories: AlertHistory[], pagination: any}>>('/api/alert-system/alert-history/');
    return response.data.data.histories; // Extract 'histories' array from nested structure
  },

  getById: async (id: number): Promise<AlertHistory> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertHistory>>(`/api/alert-system/alert-history/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<AlertHistory[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<AlertHistory[]>>(`/api/alert-system/alert-history/by-institute/${instituteId}/`);
    return response.data.data;
  },

  updateStatus: async (id: number, data: AlertHistoryStatusUpdate): Promise<AlertHistory> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertHistory>>(`/api/alert-system/alert-history/${id}/update-status/`, data);
    return response.data.data;
  },

  updateRemarks: async (id: number, data: AlertHistoryRemarksUpdate): Promise<AlertHistory> => {
    const response = await apiClient.put<AlertSystemApiResponse<AlertHistory>>(`/api/alert-system/alert-history/${id}/update-remarks/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/alert-system/alert-history/${id}/delete/`);
  }
};

// ===== INSTITUTE MODULE ACCESS API =====

export interface InstituteModuleAccess {
  institute_id: number;
  institute_name: string;
  has_alert_system_access: boolean;
}

export const instituteModuleAccessService = {
  getAlertSystemInstitutes: async (): Promise<InstituteModuleAccess[]> => {
    const response = await apiClient.get<AlertSystemApiResponse<InstituteModuleAccess[]>>('/api/core/institute-module/alert-system-institutes/');
    return response.data.data;
  }
};
