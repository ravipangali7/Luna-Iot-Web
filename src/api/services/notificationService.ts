import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { Notification, NotificationCreateData, NotificationUpdateData } from '../../types/notification';

class NotificationService {
  async getAllNotifications(): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/shared/notification', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch notifications' };
      }
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getNotificationById(id: number): Promise<{ success: boolean; data?: Notification; error?: string }> {
    try {
      // Since there's no get by id endpoint, we'll fetch all and filter
      const result = await this.getAllNotifications();
      if (result.success && result.data) {
        const notification = result.data.find(n => n.id === id);
        if (notification) {
          return { success: true, data: notification };
        } else {
          return { success: false, error: 'Notification not found' };
        }
      }
      // If getAllNotifications failed, return the error
      return { success: false, error: result.error || 'Failed to fetch notification' };
    } catch (error) {
      console.error('Get notification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createNotification(data: NotificationCreateData): Promise<{ success: boolean; data?: Notification; error?: string }> {
    try {
      const payload: any = {
        title: data.title,
        message: data.message,
        type: data.type
      };

      if (data.type === 'specific' && data.targetUserIds) {
        payload.targetUserIds = data.targetUserIds;
      }

      if (data.type === 'role' && data.targetRoleIds) {
        payload.targetRoleIds = data.targetRoleIds;
      }

      const response = await apiClient.post('/api/shared/notification/create', payload, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create notification' };
      }
    } catch (error) {
      console.error('Create notification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateNotification(_id: number, _data: NotificationUpdateData): Promise<{ success: boolean; data?: Notification; error?: string }> {
    try {
      // Note: Django doesn't have an update endpoint for notifications
      // This would need to be implemented in the backend
      // For now, we'll return an error
      return { success: false, error: 'Update notification is not supported. Notifications cannot be modified after creation.' };
    } catch (error) {
      console.error('Update notification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteNotification(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/shared/notification/${id}`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete notification' };
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async sendNotification(id: number): Promise<{ success: boolean; data?: { sent_to_count: number }; error?: string }> {
    try {
      const response = await apiClient.post(`/api/shared/notification/${id}/send`, {}, {
        timeout: 60000 // 60 seconds for sending to many users
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to send notification' };
      }
    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const notificationService = new NotificationService();

