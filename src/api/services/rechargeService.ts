import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const rechargeService = new RechargeService();
