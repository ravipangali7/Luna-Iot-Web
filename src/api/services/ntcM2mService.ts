import { apiClient } from '../apiClient';

// ===== TYPES =====

export interface NtcM2mRecord {
  [key: string]: any; // Excel columns will vary
}

export interface NtcM2mReportResponse {
  success: boolean;
  message: string;
  data: {
    records: NtcM2mRecord[];
    total_records: number;
    columns: string[];
  };
}

// ===== SERVICE =====

export const ntcM2mService = {
  fetchReport: async (): Promise<NtcM2mReportResponse['data']> => {
    // Use longer timeout for this specific endpoint (5 minutes)
    const response = await apiClient.post<NtcM2mReportResponse>(
      '/api/shared/ntc-m2m/fetch-report/',
      {},
      {
        timeout: 300000, // 5 minutes - automation can take a while
      }
    );
    return response.data.data;
  },
};
