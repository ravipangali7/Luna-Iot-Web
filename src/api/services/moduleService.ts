import { apiClient } from '../apiClient';

// Types for Module
export interface Module {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleCreate {
  name: string;
}

export interface ModuleUpdate {
  name?: string;
}

class ModuleServiceAPI {
  // Module Methods
  async getAllModules(): Promise<{ success: boolean; data?: Module[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/module/');
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch modules' };
      }
    } catch (error) {
      console.error('Get modules error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getModuleById(id: number): Promise<{ success: boolean; data?: Module; error?: string }> {
    try {
      const response = await apiClient.get(`/api/core/module/${id}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch module' };
      }
    } catch (error) {
      console.error('Get module error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createModule(data: ModuleCreate): Promise<{ success: boolean; data?: Module; error?: string }> {
    try {
      const response = await apiClient.post('/api/core/module/create/', data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create module' };
      }
    } catch (error) {
      console.error('Create module error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateModule(id: number, data: ModuleUpdate): Promise<{ success: boolean; data?: Module; error?: string }> {
    try {
      const response = await apiClient.put(`/api/core/module/${id}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update module' };
      }
    } catch (error) {
      console.error('Update module error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async deleteModule(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/core/module/${id}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete module' };
      }
    } catch (error) {
      console.error('Delete module error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const moduleService = new ModuleServiceAPI();
