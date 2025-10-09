import { apiClient } from '../apiClient';

export interface ShareTrackData {
  id: string;
  imei: string;
  token: string;
  created_at: string;
  scheduled_for: string;
  is_active: boolean;
  duration_minutes: number;
}

export interface ShareTrackResponse {
  success: boolean;
  message: string;
  data?: ShareTrackData;
  vehicle?: any; // Vehicle data from the API
  token?: string;
  is_existing?: boolean;
}

class ShareTrackService {
  private baseUrl = '/api/fleet/share-track';

  /**
   * Get share track by token (public access)
   */
  async getShareTrackByToken(token: string): Promise<ShareTrackResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/token/${token}/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching share track by token:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch share track');
    }
  }

  /**
   * Create a new share track
   */
  async createShareTrack(imei: string, durationMinutes: number): Promise<ShareTrackResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/create/`, {
        imei,
        duration_minutes: durationMinutes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating share track:', error);
      throw new Error(error.response?.data?.message || 'Failed to create share track');
    }
  }

  /**
   * Get existing share track for an IMEI
   */
  async getExistingShare(imei: string): Promise<ShareTrackData | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/existing/${imei}/`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      console.error('Error fetching existing share:', error);
      return null;
    }
  }

  /**
   * Delete share track
   */
  async deleteShareTrack(imei: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/delete/${imei}/`);
      return response.data.success;
    } catch (error: any) {
      console.error('Error deleting share track:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete share track');
    }
  }

  /**
   * Get all share tracks for current user
   */
  async getMyShareTracks(): Promise<ShareTrackData[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/my-tracks/`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      console.error('Error fetching my share tracks:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch share tracks');
    }
  }
}

export const shareTrackService = new ShareTrackService();
