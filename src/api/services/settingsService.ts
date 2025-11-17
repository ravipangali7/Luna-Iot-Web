import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { MySetting, MySettingUpdate } from '../../types/settings';

class SettingsService {
  async getSettings(): Promise<{ success: boolean; data?: MySetting; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/settings/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch settings' };
      }
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateSettings(data: MySettingUpdate): Promise<{ success: boolean; data?: MySetting; error?: string }> {
    try {
      const response = await apiClient.put('/api/core/settings/', data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update settings' };
      }
    } catch (error) {
      console.error('Update settings error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const settingsService = new SettingsService();

