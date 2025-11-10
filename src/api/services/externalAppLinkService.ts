import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';

export interface ExternalAppLink {
  id: number;
  name: string;
  link: string;
  username: string;
  password: string;
  logo: string;
  createdAt: string | null;
  updatedAt: string | null;
}

class ExternalAppLinkService {
  async getExternalAppLinks(): Promise<{ success: boolean; data?: ExternalAppLink[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/shared/external-app-links/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch external app links' };
      }
    } catch (error) {
      console.error('Get external app links error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const externalAppLinkService = new ExternalAppLinkService();

