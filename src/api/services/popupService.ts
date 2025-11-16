import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { Popup, PopupCreateData, PopupUpdateData } from '../../types/popup';

class PopupService {
  async getAllPopups(): Promise<{ success: boolean; data?: Popup[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/shared/popup/all', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch popups' };
      }
    } catch (error) {
      console.error('Get popups error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getPopupById(id: number): Promise<{ success: boolean; data?: Popup; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/popup/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch popup' };
      }
    } catch (error) {
      console.error('Get popup error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createPopup(data: PopupCreateData): Promise<{ success: boolean; data?: Popup; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('message', data.message);
      formData.append('isActive', data.isActive.toString());
      
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await apiClient.post('/api/shared/popup/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create popup' };
      }
    } catch (error) {
      console.error('Create popup error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updatePopup(id: number, data: PopupUpdateData): Promise<{ success: boolean; data?: Popup; error?: string }> {
    try {
      const formData = new FormData();
      
      if (data.title !== undefined) formData.append('title', data.title);
      if (data.message !== undefined) formData.append('message', data.message);
      if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
      
      if (data.image !== undefined) {
        if (data.image) {
          formData.append('image', data.image);
        }
      }

      const response = await apiClient.put(`/api/shared/popup/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update popup' };
      }
    } catch (error) {
      console.error('Update popup error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deletePopup(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/shared/popup/delete/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete popup' };
      }
    } catch (error) {
      console.error('Delete popup error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const popupService = new PopupService();

