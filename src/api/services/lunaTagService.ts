import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { 
  LunaTag, 
  UserLunaTag, 
  LunaTagData, 
  LunaTagFormData, 
  UserLunaTagFormData,
  PaginatedResponse 
} from '../../types/lunaTag';

class LunaTagService {
  // LunaTag CRUD (Super Admin only)
  async getAllLunaTags(page: number = 1, pageSize: number = 25): Promise<{ 
    success: boolean; 
    data?: PaginatedResponse<LunaTag>; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/device/luna-tag/?page=${page}&page_size=${pageSize}`);
      if (response.data.success) {
        return { 
          success: true, 
          data: {
            data: response.data.data.luna_tags,
            pagination: response.data.data.pagination
          }
        };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch Luna Tags' };
      }
    } catch (error) {
      console.error('Get Luna Tags error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createLunaTag(data: LunaTagFormData): Promise<{ success: boolean; data?: LunaTag; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/luna-tag/create', data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create Luna Tag' };
      }
    } catch (error) {
      console.error('Create Luna Tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateLunaTag(id: number, data: Partial<LunaTagFormData>): Promise<{ success: boolean; data?: LunaTag; error?: string }> {
    try {
      const response = await apiClient.put(`/api/device/luna-tag/update/${id}`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update Luna Tag' };
      }
    } catch (error) {
      console.error('Update Luna Tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteLunaTag(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/device/luna-tag/delete/${id}`);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete Luna Tag' };
      }
    } catch (error) {
      console.error('Delete Luna Tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // UserLunaTag CRUD (Role-based)
  async getAllUserLunaTags(page: number = 1, pageSize: number = 25): Promise<{ 
    success: boolean; 
    data?: PaginatedResponse<UserLunaTag>; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/device/user-luna-tag/?page=${page}&page_size=${pageSize}`);
      if (response.data.success) {
        return { 
          success: true, 
          data: {
            data: response.data.data.user_luna_tags,
            pagination: response.data.data.pagination
          }
        };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch User Luna Tags' };
      }
    } catch (error) {
      console.error('Get User Luna Tags error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createUserLunaTag(data: UserLunaTagFormData): Promise<{ success: boolean; data?: UserLunaTag; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('publicKey', data.publicKey);
      formData.append('name', data.name);
      if (data.image && data.image instanceof File) {
        formData.append('image', data.image);
      } else if (data.image) {
        formData.append('image', data.image);
      }
      if (data.expire_date) {
        formData.append('expire_date', data.expire_date);
      }
      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active.toString());
      }

      const response = await apiClient.post('/api/device/user-luna-tag/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create User Luna Tag' };
      }
    } catch (error) {
      console.error('Create User Luna Tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateUserLunaTag(id: number, data: Partial<UserLunaTagFormData>): Promise<{ success: boolean; data?: UserLunaTag; error?: string }> {
    try {
      const formData = new FormData();
      if (data.publicKey !== undefined) {
        formData.append('publicKey', data.publicKey);
      }
      if (data.name !== undefined) {
        formData.append('name', data.name);
      }
      if (data.image && data.image instanceof File) {
        formData.append('image', data.image);
      } else if (data.image !== undefined) {
        formData.append('image', data.image || '');
      }
      if (data.expire_date !== undefined) {
        formData.append('expire_date', data.expire_date || '');
      }
      if (data.is_active !== undefined) {
        formData.append('is_active', data.is_active.toString());
      }

      const response = await apiClient.put(`/api/device/user-luna-tag/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update User Luna Tag' };
      }
    } catch (error) {
      console.error('Update User Luna Tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteUserLunaTag(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/device/user-luna-tag/delete/${id}`);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete User Luna Tag' };
      }
    } catch (error) {
      console.error('Delete User Luna Tag error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // LunaTagData (Read-only)
  async getLunaTagData(publicKey: string): Promise<{ success: boolean; data?: LunaTagData; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/luna-tag-data/${publicKey}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch Luna Tag data' };
      }
    } catch (error) {
      console.error('Get Luna Tag data error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const lunaTagService = new LunaTagService();

