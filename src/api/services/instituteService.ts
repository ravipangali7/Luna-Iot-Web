import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { PaginatedResponse, PaginationParams } from '../../types/pagination';

// Types for Institute Service
export interface InstituteService {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface InstituteServiceCreate {
  name: string;
  icon?: string;
  description?: string;
}

export interface InstituteServiceUpdate {
  name?: string;
  icon?: string;
  description?: string;
}

// Types for Institute
export interface Institute {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  institute_services: InstituteService[];
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface InstituteCreate {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  logo?: File;
  service_ids?: number[];
}

export interface InstituteUpdate {
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  logo?: File;
  service_ids?: number[];
}

// Types for Institute Module
export interface InstituteModule {
  id: number;
  institute: number;
  institute_name: string;
  module: number;
  module_name: string;
  users: Array<{
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
  }>;
  user_count: number;
  expire_date?: string | null;
  renewal_price?: number | null;
  created_at: string;
  updated_at: string;
}

export interface InstituteModuleCreate {
  institute: number;
  module: number;
  user_ids?: number[];
  expire_date?: string | null;
  renewal_price?: number | null;
}

export interface InstituteModuleUpdate {
  institute?: number;
  module?: number;
  user_ids?: number[];
  expire_date?: string | null;
  renewal_price?: number | null;
}

class InstituteServiceAPI {
  // Institute Service Methods
  async getAllInstituteServices(): Promise<{ success: boolean; data?: InstituteService[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/institute/services/');
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institute services' };
      }
    } catch (error) {
      console.error('Get institute services error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getInstituteServiceById(id: number): Promise<{ success: boolean; data?: InstituteService; error?: string }> {
    try {
      const response = await apiClient.get(`/api/core/institute/services/${id}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institute service' };
      }
    } catch (error) {
      console.error('Get institute service error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createInstituteService(data: InstituteServiceCreate): Promise<{ success: boolean; data?: InstituteService; error?: string }> {
    try {
      const response = await apiClient.post('/api/core/institute/services/create/', data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create institute service' };
      }
    } catch (error) {
      console.error('Create institute service error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateInstituteService(id: number, data: InstituteServiceUpdate): Promise<{ success: boolean; data?: InstituteService; error?: string }> {
    try {
      const response = await apiClient.put(`/api/core/institute/services/${id}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update institute service' };
      }
    } catch (error) {
      console.error('Update institute service error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteInstituteService(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/core/institute/services/${id}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete institute service' };
      }
    } catch (error) {
      console.error('Delete institute service error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Institute Methods
  async getAllInstitutes(): Promise<{ success: boolean; data?: Institute[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/institute/');
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institutes' };
      }
    } catch (error) {
      console.error('Get institutes error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getInstitutesPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Institute>> {
    try {
      const { page = 1, page_size = 20, search = '' } = params;
      
      const response = await apiClient.get('/api/core/institute/paginated/', {
        params: { page, page_size, search },
        timeout: 30000
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            items: response.data.data.institutes,
            pagination: response.data.data.pagination,
            search_query: response.data.data.search_query
          }
        };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getInstituteById(id: number): Promise<{ success: boolean; data?: Institute; error?: string }> {
    try {
      const response = await apiClient.get(`/api/core/institute/${id}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institute' };
      }
    } catch (error) {
      console.error('Get institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createInstitute(data: InstituteCreate): Promise<{ success: boolean; data?: Institute; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.phone) formData.append('phone', data.phone);
      if (data.address) formData.append('address', data.address);
      if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
      if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
      if (data.logo) formData.append('logo', data.logo);
      if (data.service_ids) {
        data.service_ids.forEach(id => formData.append('service_ids', id.toString()));
      }

      const response = await apiClient.post('/api/core/institute/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create institute' };
      }
    } catch (error) {
      console.error('Create institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateInstitute(id: number, data: InstituteUpdate): Promise<{ success: boolean; data?: Institute; error?: string }> {
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description !== undefined) formData.append('description', data.description);
      if (data.phone !== undefined) formData.append('phone', data.phone);
      if (data.address !== undefined) formData.append('address', data.address);
      if (data.latitude !== undefined) formData.append('latitude', data.latitude.toString());
      if (data.longitude !== undefined) formData.append('longitude', data.longitude.toString());
      if (data.logo) formData.append('logo', data.logo);
      if (data.service_ids !== undefined) {
        data.service_ids.forEach(id => formData.append('service_ids', id.toString()));
      }

      const response = await apiClient.put(`/api/core/institute/${id}/update/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update institute' };
      }
    } catch (error) {
      console.error('Update institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteInstitute(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/core/institute/${id}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete institute' };
      }
    } catch (error) {
      console.error('Delete institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Institute Module Methods
  async getAllInstituteModules(): Promise<{ success: boolean; data?: InstituteModule[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/institute/modules/');
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institute modules' };
      }
    } catch (error) {
      console.error('Get institute modules error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getInstituteModulesByInstitute(instituteId: number): Promise<{ success: boolean; data?: InstituteModule[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/core/institute/${instituteId}/modules/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institute modules' };
      }
    } catch (error) {
      console.error('Get institute modules error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getInstituteModuleById(id: number): Promise<{ success: boolean; data?: InstituteModule; error?: string }> {
    try {
      const response = await apiClient.get(`/api/core/institute/modules/${id}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch institute module' };
      }
    } catch (error) {
      console.error('Get institute module error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createInstituteModule(data: InstituteModuleCreate): Promise<{ success: boolean; data?: InstituteModule; error?: string }> {
    try {
      const response = await apiClient.post('/api/core/institute/modules/create/', data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create institute module' };
      }
    } catch (error) {
      console.error('Create institute module error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateInstituteModule(id: number, data: InstituteModuleUpdate): Promise<{ success: boolean; data?: InstituteModule; error?: string }> {
    try {
      const response = await apiClient.put(`/api/core/institute/modules/${id}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update institute module' };
      }
    } catch (error) {
      console.error('Update institute module error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteInstituteModule(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/core/institute/modules/${id}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete institute module' };
      }
    } catch (error) {
      console.error('Delete institute module error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateInstituteModuleUsers(id: number, userIds: number[]): Promise<{ success: boolean; data?: InstituteModule; error?: string }> {
    try {
      const response = await apiClient.put(`/api/core/institute/modules/${id}/users/`, {
        user_ids: userIds
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update institute module users' };
      }
    } catch (error) {
      console.error('Update institute module users error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const instituteService = new InstituteServiceAPI();
