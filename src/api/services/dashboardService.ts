import { apiClient } from '../apiClient';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDealers: number;
  totalCustomers: number;
  totalDevices: number;
  totalVehicles: number;
  expiredVehicles: number;
  totalSms: number;
  totalBalance: number;
  serverBalance: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalDealers: number;
  totalCustomers: number;
  totalAdmins: number;
  roleBreakdown: Record<string, number>;
}

export interface DeviceStats {
  totalDevices: number;
  devicesByModel: Record<string, number>;
  devicesByProtocol: Record<string, number>;
  devicesBySim: Record<string, number>;
}

export interface VehicleStats {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  expiredVehicles: number;
  vehiclesByType: Record<string, number>;
  vehiclesExpiringSoon: number;
}

class DashboardService {
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/dashboard/stats/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch dashboard stats' };
      }
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getUserStats(): Promise<{ success: boolean; data?: UserStats; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/dashboard/stats/users/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch user stats' };
      }
    } catch (error) {
      console.error('Get user stats error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getDeviceStats(): Promise<{ success: boolean; data?: DeviceStats; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/dashboard/stats/devices/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch device stats' };
      }
    } catch (error) {
      console.error('Get device stats error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getVehicleStats(): Promise<{ success: boolean; data?: VehicleStats; error?: string }> {
    try {
      const response = await apiClient.get('/api/core/dashboard/stats/vehicles/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch vehicle stats' };
      }
    } catch (error) {
      console.error('Get vehicle stats error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const dashboardService = new DashboardService();
