import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type {
  Cart,
  DeviceOrder,
  DeviceOrderListResponse,
  OrderStatusUpdate,
  SubscriptionPlanBasic
} from '../../types/deviceOrder';

class DeviceOrderService {
  // Cart Management
  async getCart(): Promise<{ success: boolean; data?: Cart; error?: string }> {
    try {
      const response = await apiClient.get('/api/device/cart/');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch cart' };
      }
    } catch (error) {
      console.error('Get cart error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async addToCart(subscriptionPlanId: number, quantity: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/cart/add/', {
        subscription_plan_id: subscriptionPlanId,
        quantity: quantity
      });
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to add to cart' };
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateCartItem(itemIndex: number, quantity: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.put(`/api/device/cart/update/${itemIndex}/`, {
        quantity: quantity
      });
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to update cart item' };
      }
    } catch (error) {
      console.error('Update cart item error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async removeFromCart(itemIndex: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/device/cart/remove/${itemIndex}/`);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to remove from cart' };
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async clearCart(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete('/api/device/cart/clear/');
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to clear cart' };
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Order Management
  async createOrder(isVat: boolean): Promise<{ success: boolean; data?: DeviceOrder; error?: string }> {
    try {
      const response = await apiClient.post('/api/device/orders/create/', {
        is_vat: isVat
      });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create order' };
      }
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getOrders(
    page: number = 1,
    search: string = '',
    status?: string,
    paymentStatus?: string
  ): Promise<{ success: boolean; data?: DeviceOrderListResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (search) {
        params.append('search', search);
      }
      if (status) {
        params.append('status', status);
      }
      if (paymentStatus) {
        params.append('payment_status', paymentStatus);
      }

      const response = await apiClient.get(`/api/device/orders/?${params.toString()}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch orders' };
      }
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getOrder(orderId: number): Promise<{ success: boolean; data?: DeviceOrder; error?: string }> {
    try {
      const response = await apiClient.get(`/api/device/orders/${orderId}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch order' };
      }
    } catch (error) {
      console.error('Get order error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateOrderStatus(
    orderId: number,
    statusUpdate: OrderStatusUpdate
  ): Promise<{ success: boolean; data?: DeviceOrder; error?: string }> {
    try {
      const response = await apiClient.put(`/api/device/orders/${orderId}/status/`, statusUpdate);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update order status' };
      }
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Product Listing for Orders
  async getSubscriptionPlansForOrder(): Promise<{
    success: boolean;
    data?: SubscriptionPlanBasic[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/device/subscription-plans/for-order/');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch subscription plans' };
      }
    } catch (error) {
      console.error('Get subscription plans for order error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const deviceOrderService = new DeviceOrderService();

