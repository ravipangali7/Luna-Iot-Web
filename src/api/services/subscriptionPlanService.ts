import { apiClient } from '../apiClient';
import type { 
  SubscriptionPlan, 
  SubscriptionPlanFormData, 
  SubscriptionPlanListResponse,
  Permission 
} from '../../types/subscriptionPlan';

class SubscriptionPlanService {
  async getAllSubscriptionPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/device/subscription-plan/');
      if (response.data.success) {
        return { success: true, data: response.data.data.subscription_plans };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch subscription plans' };
      }
    } catch (error) {
      console.error('Get subscription plans error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSubscriptionPlansPaginated(page: number = 1, search: string = ''): Promise<{ 
    success: boolean; 
    data?: SubscriptionPlanListResponse; 
    error?: string 
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get(`/api/device/subscription-plan/?${params.toString()}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch paginated subscription plans' };
      }
    } catch (error) {
      console.error('Get paginated subscription plans error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSubscriptionPlan(id: number): Promise<{ success: boolean; data?: SubscriptionPlan; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/subscription-plan/${id}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch subscription plan' };
      }
    } catch (error) {
      console.error('Get subscription plan error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createSubscriptionPlan(data: SubscriptionPlanFormData): Promise<{ success: boolean; data?: SubscriptionPlan; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/subscription-plan/create/', data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create subscription plan' };
      }
    } catch (error) {
      console.error('Create subscription plan error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlanFormData>): Promise<{ success: boolean; data?: SubscriptionPlan; error?: string }> {
    try {
      const response = await apiClient.put(`/api/device/subscription-plan/${id}/update/`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update subscription plan' };
      }
    } catch (error) {
      console.error('Update subscription plan error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async deleteSubscriptionPlan(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/device/subscription-plan/${id}/delete/`);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete subscription plan' };
      }
    } catch (error) {
      console.error('Delete subscription plan error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getAvailablePermissions(): Promise<{ success: boolean; data?: Permission[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/device/subscription-plan/permissions/');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch permissions' };
      }
    } catch (error) {
      console.error('Get permissions error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
