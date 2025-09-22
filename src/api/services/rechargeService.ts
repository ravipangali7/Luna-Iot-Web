import { apiClient } from '../apiClient';
import type { Recharge, RechargeFormData, RechargeFilters, RechargeStats, RechargeResponse } from '../../types/recharge';

class RechargeService {
  async getAllRecharges(): Promise<{ success: boolean; data?: Recharge[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/recharge`, {
        timeout: 120000 // 2 minutes for large responses
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch recharges' };
      }
    } catch (error) {
      console.error('Get recharges error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getRechargesWithPagination(
    page: number = 1, 
    limit: number = 10, 
    filters?: RechargeFilters
  ): Promise<{ success: boolean; data?: RechargeResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.deviceId && { deviceId: filters.deviceId.toString() }),
        ...(filters?.amountMin && { amountMin: filters.amountMin.toString() }),
        ...(filters?.amountMax && { amountMax: filters.amountMax.toString() }),
        ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters?.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await apiClient.get(`/api/shared/recharge/paginated?${params}`, {
        timeout: 120000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch recharges' };
      }
    } catch (error) {
      console.error('Get recharges with pagination error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getRechargeById(id: number): Promise<{ success: boolean; data?: Recharge; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/recharge/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch recharge' };
      }
    } catch (error) {
      console.error('Get recharge error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getRechargesByDeviceId(deviceId: number): Promise<{ success: boolean; data?: Recharge[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/recharge/device/${deviceId}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch device recharges' };
      }
    } catch (error) {
      console.error('Get device recharges error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getRechargeStats(deviceId: number): Promise<{ success: boolean; data?: RechargeStats; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/recharge/stats/${deviceId}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch recharge statistics' };
      }
    } catch (error) {
      console.error('Get recharge stats error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getTotalRecharge(deviceId: number): Promise<{ success: boolean; data?: { totalAmount: number }; error?: string }> {
    try {
      const response = await apiClient.get(`/api/shared/recharge/total/${deviceId}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch total recharge' };
      }
    } catch (error) {
      console.error('Get total recharge error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createRecharge(data: RechargeFormData): Promise<{ success: boolean; data?: Recharge; error?: string }> {
    try {
      const response = await apiClient.post('/api/shared/recharge/create', data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create recharge' };
      }
    } catch (error: unknown) {
      console.error('Create recharge error:', error);
      
      // Handle different types of errors
      if (error && typeof error === 'object' && 'response' in error) {
        // Server responded with error status
        const axiosError = error as { response: { data?: { message?: string; error?: string }; status: number } };
        const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Server error';
        const statusCode = axiosError.response.status;
        
        return { 
          success: false, 
          error: `Error ${statusCode}: ${errorMessage}` 
        };
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Network error - no response received
        return { 
          success: false, 
          error: 'Network error: Unable to connect to server. Please check your internet connection.' 
        };
      } else {
        // Other error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { 
          success: false, 
          error: `Error: ${errorMessage}` 
        };
      }
    }
  }

  async deleteRecharge(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/shared/recharge/delete/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete recharge' };
      }
    } catch (error) {
      console.error('Delete recharge error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const rechargeService = new RechargeService();
