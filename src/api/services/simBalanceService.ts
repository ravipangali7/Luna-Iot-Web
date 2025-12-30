import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { SimBalance, SimBalanceImportResult, SimBalanceFilters, SimBalancePaginationResponse } from '../../types/simBalance';

class SimBalanceService {
  async uploadSimData(file: File): Promise<{ success: boolean; data?: SimBalanceImportResult; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/api/shared/sim-balance/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minutes for file upload
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to upload SIM data' };
      }
    } catch (error) {
      console.error('Upload SIM data error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getAllSimBalances(): Promise<{ success: boolean; data?: SimBalance[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/sim-balance`, {
        timeout: 120000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch SIM balances' };
      }
    } catch (error) {
      console.error('Get SIM balances error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getSimBalancesWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: SimBalanceFilters
  ): Promise<{ success: boolean; data?: SimBalancePaginationResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.phone_number && { phone_number: filters.phone_number }),
        ...(filters?.state && { state: filters.state }),
        ...(filters?.device_id && { device_id: filters.device_id.toString() }),
        ...(filters?.min_balance && { min_balance: filters.min_balance.toString() }),
        ...(filters?.max_balance && { max_balance: filters.max_balance.toString() }),
        ...(filters?.expiry_before && { expiry_before: filters.expiry_before }),
        ...(filters?.expiry_after && { expiry_after: filters.expiry_after }),
      });

      const response = await apiClient.get(`/api/shared/sim-balance/paginated?${params}`, {
        timeout: 120000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch SIM balances' };
      }
    } catch (error) {
      console.error('Get SIM balances with pagination error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getSimBalanceById(id: number): Promise<{ success: boolean; data?: SimBalance; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/sim-balance/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch SIM balance' };
      }
    } catch (error) {
      console.error('Get SIM balance error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getSimBalanceByDevice(deviceId: number): Promise<{ success: boolean; data?: SimBalance; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/sim-balance/device/${deviceId}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch device SIM balance' };
      }
    } catch (error) {
      console.error('Get SIM balance by device error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getSimBalanceByPhone(phone: string): Promise<{ success: boolean; data?: SimBalance; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/sim-balance/phone/${phone}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch SIM balance by phone' };
      }
    } catch (error) {
      console.error('Get SIM balance by phone error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteSimBalance(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/shared/sim-balance/${id}/delete`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete SIM balance' };
      }
    } catch (error) {
      console.error('Delete SIM balance error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const simBalanceService = new SimBalanceService();

