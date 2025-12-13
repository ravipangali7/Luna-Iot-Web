import { apiClient } from '../apiClient';

// ===== TYPES =====

export interface CommunitySirenBuzzer {
  id: number;
  title: string;
  device: number;
  device_imei: string;
  device_phone: string;
  device_name?: string;
  delay: number;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface CommunitySirenSwitch {
  id: number;
  title: string;
  device: number;
  device_imei: string;
  device_phone: string;
  device_name?: string;
  latitude: number;
  longitude: number;
  trigger: number | string;
  primary_phone: string;
  secondary_phone: string | null;
  image: string | null;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface CommunitySirenMembers {
  id: number;
  user: number;
  user_name: string;
  user_phone: string;
  created_at: string;
  updated_at: string;
}

export interface CommunitySirenContact {
  id: number;
  name: string;
  phone: string;
  is_sms: boolean;
  is_call: boolean;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

export interface CommunitySirenHistory {
  id: number;
  source: string;
  source_display: string;
  name: string;
  primary_phone: string;
  secondary_phone: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  datetime: string;
  images: string | null;
  remarks: string | null;
  status: string;
  status_display: string;
  institute: number;
  institute_name: string;
  member: number | null;
  member_name: string | null;
  member_phone: string | null;
  created_at: string;
  updated_at: string;
}

// ===== CREATE/UPDATE INTERFACES =====

export interface CommunitySirenBuzzerCreate {
  title: string;
  device: number;
  delay: number;
  institute: number;
}

export interface CommunitySirenBuzzerUpdate {
  title?: string;
  device?: number;
  delay?: number;
}

export interface CommunitySirenSwitchCreate {
  title: string;
  device: number;
  latitude: number;
  longitude: number;
  trigger: number;
  primary_phone: string;
  secondary_phone?: string;
  image?: File | null;
  institute: number;
}

export interface CommunitySirenSwitchUpdate {
  title?: string;
  device?: number;
  latitude?: number;
  longitude?: number;
  trigger?: number;
  primary_phone?: string;
  secondary_phone?: string;
  image?: File | null;
}

export interface CommunitySirenMembersCreate {
  user: number;
}

export interface CommunitySirenMembersUpdate {
  user?: number;
}

export interface CommunitySirenContactCreate {
  name: string;
  phone: string;
  is_sms: boolean;
  is_call: boolean;
  institute: number;
}

export interface CommunitySirenContactUpdate {
  name?: string;
  phone?: string;
  is_sms?: boolean;
  is_call?: boolean;
}

export interface CommunitySirenHistoryCreate {
  source: string;
  name: string;
  primary_phone: string;
  secondary_phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  datetime: string;
  images?: File | null;
  remarks?: string;
  status?: string;
  institute: number;
}

export interface CommunitySirenHistoryUpdate {
  source?: string;
  name?: string;
  primary_phone?: string;
  secondary_phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  datetime?: string;
  images?: File | null;
  remarks?: string;
  status?: string;
}

export interface CommunitySirenHistoryStatusUpdate {
  status: string;
}

// ===== API RESPONSE TYPES =====

export interface CommunitySirenApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// ===== COMMUNITY SIREN BUZZER API =====

export const communitySirenBuzzerService = {
  getAll: async (): Promise<CommunitySirenBuzzer[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenBuzzer[]>>('/api/community-siren/community-siren-buzzer/');
    return response.data.data;
  },

  getById: async (id: number): Promise<CommunitySirenBuzzer> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenBuzzer>>(`/api/community-siren/community-siren-buzzer/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<CommunitySirenBuzzer[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenBuzzer[]>>(`/api/community-siren/community-siren-buzzer/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: CommunitySirenBuzzerCreate): Promise<CommunitySirenBuzzer> => {
    const response = await apiClient.post<CommunitySirenApiResponse<CommunitySirenBuzzer>>('/api/community-siren/community-siren-buzzer/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: CommunitySirenBuzzerUpdate): Promise<CommunitySirenBuzzer> => {
    const response = await apiClient.put<CommunitySirenApiResponse<CommunitySirenBuzzer>>(`/api/community-siren/community-siren-buzzer/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/community-siren/community-siren-buzzer/${id}/delete/`);
  }
};

// ===== COMMUNITY SIREN SWITCH API =====

export const communitySirenSwitchService = {
  getAll: async (): Promise<CommunitySirenSwitch[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenSwitch[]>>('/api/community-siren/community-siren-switch/');
    return response.data.data;
  },

  getById: async (id: number): Promise<CommunitySirenSwitch> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenSwitch>>(`/api/community-siren/community-siren-switch/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<CommunitySirenSwitch[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenSwitch[]>>(`/api/community-siren/community-siren-switch/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: CommunitySirenSwitchCreate): Promise<CommunitySirenSwitch> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('device', data.device.toString());
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    formData.append('trigger', data.trigger.toString());
    formData.append('primary_phone', data.primary_phone);
    if (data.secondary_phone) formData.append('secondary_phone', data.secondary_phone);
    formData.append('institute', data.institute.toString());
    if (data.image) formData.append('image', data.image);

    const response = await apiClient.post<CommunitySirenApiResponse<CommunitySirenSwitch>>('/api/community-siren/community-siren-switch/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  update: async (id: number, data: CommunitySirenSwitchUpdate): Promise<CommunitySirenSwitch> => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.device) formData.append('device', data.device.toString());
    if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
    if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
    if (data.trigger) formData.append('trigger', data.trigger.toString());
    if (data.primary_phone) formData.append('primary_phone', data.primary_phone);
    if (data.secondary_phone !== undefined) formData.append('secondary_phone', data.secondary_phone);
    if (data.image !== undefined) {
      if (data.image) formData.append('image', data.image);
      else formData.append('image', '');
    }

    const response = await apiClient.put<CommunitySirenApiResponse<CommunitySirenSwitch>>(`/api/community-siren/community-siren-switch/${id}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/community-siren/community-siren-switch/${id}/delete/`);
  }
};

// ===== COMMUNITY SIREN MEMBERS API =====

export const communitySirenMembersService = {
  getAll: async (): Promise<CommunitySirenMembers[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenMembers[]>>('/api/community-siren/community-siren-members/');
    return response.data.data;
  },

  getById: async (id: number): Promise<CommunitySirenMembers> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenMembers>>(`/api/community-siren/community-siren-members/${id}/`);
    return response.data.data;
  },

  create: async (data: CommunitySirenMembersCreate): Promise<CommunitySirenMembers> => {
    const response = await apiClient.post<CommunitySirenApiResponse<CommunitySirenMembers>>('/api/community-siren/community-siren-members/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: CommunitySirenMembersUpdate): Promise<CommunitySirenMembers> => {
    const response = await apiClient.put<CommunitySirenApiResponse<CommunitySirenMembers>>(`/api/community-siren/community-siren-members/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/community-siren/community-siren-members/${id}/delete/`);
  }
};

// ===== COMMUNITY SIREN CONTACT API =====

export const communitySirenContactService = {
  getAll: async (): Promise<CommunitySirenContact[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenContact[]>>('/api/community-siren/community-siren-contact/');
    return response.data.data;
  },

  getById: async (id: number): Promise<CommunitySirenContact> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenContact>>(`/api/community-siren/community-siren-contact/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number): Promise<CommunitySirenContact[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenContact[]>>(`/api/community-siren/community-siren-contact/by-institute/${instituteId}/`);
    return response.data.data;
  },

  create: async (data: CommunitySirenContactCreate): Promise<CommunitySirenContact> => {
    const response = await apiClient.post<CommunitySirenApiResponse<CommunitySirenContact>>('/api/community-siren/community-siren-contact/create/', data);
    return response.data.data;
  },

  update: async (id: number, data: CommunitySirenContactUpdate): Promise<CommunitySirenContact> => {
    const response = await apiClient.put<CommunitySirenApiResponse<CommunitySirenContact>>(`/api/community-siren/community-siren-contact/${id}/update/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/community-siren/community-siren-contact/${id}/delete/`);
  }
};

// ===== COMMUNITY SIREN HISTORY API =====

export const communitySirenHistoryService = {
  getAll: async (params?: { search?: string; status?: string; source?: string; page?: number; page_size?: number }): Promise<{ histories: CommunitySirenHistory[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await apiClient.get<CommunitySirenApiResponse<{ histories: CommunitySirenHistory[]; pagination: any }>>(`/api/community-siren/community-siren-history/?${queryParams.toString()}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<CommunitySirenHistory> => {
    const response = await apiClient.get<CommunitySirenApiResponse<CommunitySirenHistory>>(`/api/community-siren/community-siren-history/${id}/`);
    return response.data.data;
  },

  getByInstitute: async (instituteId: number, params?: { search?: string; status?: string; source?: string; page?: number; page_size?: number }): Promise<{ histories: CommunitySirenHistory[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await apiClient.get<CommunitySirenApiResponse<{ histories: CommunitySirenHistory[]; pagination: any }>>(`/api/community-siren/community-siren-history/by-institute/${instituteId}/?${queryParams.toString()}`);
    return response.data.data;
  },

  create: async (data: CommunitySirenHistoryCreate): Promise<CommunitySirenHistory> => {
    const formData = new FormData();
    formData.append('source', data.source);
    formData.append('name', data.name);
    formData.append('primary_phone', data.primary_phone);
    if (data.secondary_phone) formData.append('secondary_phone', data.secondary_phone);
    if (data.latitude !== undefined && data.latitude !== null) formData.append('latitude', data.latitude.toString());
    if (data.longitude !== undefined && data.longitude !== null) formData.append('longitude', data.longitude.toString());
    formData.append('datetime', data.datetime);
    if (data.images) formData.append('images', data.images);
    if (data.remarks) formData.append('remarks', data.remarks);
    if (data.status) formData.append('status', data.status);
    formData.append('institute', data.institute.toString());

    const response = await apiClient.post<CommunitySirenApiResponse<CommunitySirenHistory>>('/api/community-siren/community-siren-history/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  update: async (id: number, data: CommunitySirenHistoryUpdate): Promise<CommunitySirenHistory> => {
    const formData = new FormData();
    if (data.source) formData.append('source', data.source);
    if (data.name) formData.append('name', data.name);
    if (data.primary_phone) formData.append('primary_phone', data.primary_phone);
    if (data.secondary_phone !== undefined) formData.append('secondary_phone', data.secondary_phone);
    if (data.latitude !== undefined && data.latitude !== null) formData.append('latitude', data.latitude.toString());
    if (data.longitude !== undefined && data.longitude !== null) formData.append('longitude', data.longitude.toString());
    if (data.datetime) formData.append('datetime', data.datetime);
    if (data.images !== undefined) {
      if (data.images) formData.append('images', data.images);
      else formData.append('images', '');
    }
    if (data.remarks !== undefined) formData.append('remarks', data.remarks);
    if (data.status) formData.append('status', data.status);

    const response = await apiClient.put<CommunitySirenApiResponse<CommunitySirenHistory>>(`/api/community-siren/community-siren-history/${id}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  updateStatus: async (id: number, data: CommunitySirenHistoryStatusUpdate): Promise<CommunitySirenHistory> => {
    const response = await apiClient.patch<CommunitySirenApiResponse<CommunitySirenHistory>>(`/api/community-siren/community-siren-history/${id}/update-status/`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/community-siren/community-siren-history/${id}/delete/`);
  }
};

// ===== INSTITUTE MODULE ACCESS =====

export interface InstituteModuleAccess {
  institute_id: number;
  institute_name: string;
  has_community_siren_access: boolean;
}

export const instituteModuleAccessService = {
  getCommunitySirenInstitutes: async (): Promise<InstituteModuleAccess[]> => {
    const response = await apiClient.get<CommunitySirenApiResponse<InstituteModuleAccess[]>>('/api/core/institute/modules/community-siren-institutes/');
    return response.data.data;
  }
};
