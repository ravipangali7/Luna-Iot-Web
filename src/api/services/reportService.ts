import { apiClient } from '../apiClient';
import type { ReportData } from '../../types/report';

class ReportService {
  async generateReport(
    imei: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; data?: ReportData; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/location/${imei}/report`, {
        params: {
          startDate,
          endDate,
        },
        timeout: 120000 // 2 minutes for potentially large report data
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to generate report',
        };
      }
    } catch (error: any) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Network error: ' + error.message,
      };
    }
  }
}

export const reportService = new ReportService();
