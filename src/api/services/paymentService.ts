import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type {
  PaymentInitiateRequest,
  PaymentFormData,
  PaymentTransaction,
  PaymentCallbackParams,
  PaymentValidateRequest,
} from '../../types/payment';

class PaymentService {
  /**
   * Initiate a payment by requesting payment form data from backend
   */
  async initiatePayment(
    data: PaymentInitiateRequest
  ): Promise<{ success: boolean; data?: PaymentFormData; error?: string }> {
    try {
      const response = await apiClient.post('/api/finance/payment/initiate/', data, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to initiate payment' };
      }
    } catch (error) {
      console.error('Initiate payment error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Handle payment callback from ConnectIPS gateway
   * This is called by the backend callback endpoint
   */
  async handleCallback(
    params: PaymentCallbackParams
  ): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.txn_id) queryParams.append('txn_id', params.txn_id);
      if (params.status) queryParams.append('status', params.status);

      const response = await apiClient.get(
        `/api/finance/payment/callback/?${queryParams.toString()}`,
        {
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Payment callback failed' };
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Manually validate a payment transaction
   */
  async validatePayment(
    data: PaymentValidateRequest
  ): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    try {
      const response = await apiClient.post('/api/finance/payment/validate/', data, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Payment validation failed' };
      }
    } catch (error) {
      console.error('Validate payment error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Get all payment transactions for the current user
   */
  async getPaymentTransactions(): Promise<{
    success: boolean;
    data?: PaymentTransaction[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get('/api/finance/payment/transactions/', {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch payment transactions',
        };
      }
    } catch (error) {
      console.error('Get payment transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Get a specific payment transaction by ID
   */
  async getPaymentTransactionById(
    id: number
  ): Promise<{ success: boolean; data?: PaymentTransaction; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/payment/transactions/${id}/`, {
        timeout: 30000,
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch payment transaction',
        };
      }
    } catch (error) {
      console.error('Get payment transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const paymentService = new PaymentService();

