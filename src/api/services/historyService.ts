import { apiClient } from '../apiClient';
import type { History } from '../../types/history';

class HistoryService {
  async getCombinedHistoryByDateRange(
    imei: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; data?: History[]; error?: string }> {
    try {
      // Format dates as YYYY-MM-DD (no time, no timezone)
      const startDateStr = startDate.split('T')[0];
      const endDateStr = endDate.split('T')[0];

      console.log('Fetching history data:', { imei, startDateStr, endDateStr });

      const response = await apiClient.get(`/api/device/location/${imei}/combined-history`, {
        params: { startDate: startDateStr, endDate: endDateStr },
        timeout: 120000 // 2 minutes for potentially large history data
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch history data' };
      }
    } catch (error) {
      console.error('History fetch error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const historyService = new HistoryService();
