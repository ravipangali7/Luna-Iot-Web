import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { 
  DueTransaction, 
  DueTransactionListItem, 
  DueTransactionCreate 
} from '../../types/dueTransaction';
import type { PaginatedResponse, PaginationParams } from '../../types/pagination';

class DueTransactionService {
  async getAllDueTransactions(params: PaginationParams & { is_paid?: boolean } = {}): Promise<PaginatedResponse<DueTransactionListItem>> {
    try {
      const { page = 1, page_size = 20, search = '', is_paid } = params;
      
      const response = await apiClient.get('/api/finance/due-transaction/', {
        params: { page, page_size, search, is_paid },
        timeout: 30000
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            items: response.data.data.results,
            pagination: response.data.data.pagination
          }
        };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Failed to fetch due transactions' 
        };
      }
    } catch (error) {
      console.error('Get due transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getDueTransactionById(id: number): Promise<{ success: boolean; data?: DueTransaction; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/due-transaction/${id}/`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch due transaction' };
      }
    } catch (error) {
      console.error('Get due transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getUserDueTransactions(userId: number, params: PaginationParams & { is_paid?: boolean } = {}): Promise<PaginatedResponse<DueTransactionListItem>> {
    try {
      const { page = 1, page_size = 20, is_paid } = params;
      
      const response = await apiClient.get(`/api/finance/due-transaction/user/${userId}/`, {
        params: { page, page_size, is_paid },
        timeout: 30000
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            items: response.data.data.results,
            pagination: response.data.data.pagination
          }
        };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Failed to fetch user due transactions' 
        };
      }
    } catch (error) {
      console.error('Get user due transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getMyDueTransactions(params: PaginationParams & { is_paid?: boolean } = {}): Promise<PaginatedResponse<DueTransactionListItem>> {
    try {
      const { page = 1, page_size = 20, is_paid } = params;
      
      const response = await apiClient.get('/api/finance/due-transaction/my/', {
        params: { page, page_size, is_paid },
        timeout: 30000
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            items: response.data.data.results,
            pagination: response.data.data.pagination
          }
        };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Failed to fetch my due transactions' 
        };
      }
    } catch (error) {
      console.error('Get my due transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async payWithWallet(dueTransactionId: number): Promise<{ success: boolean; data?: DueTransaction; error?: string }> {
    try {
      const response = await apiClient.post(
        `/api/finance/due-transaction/${dueTransactionId}/pay/`,
        {},
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to pay due transaction' };
      }
    } catch (error) {
      console.error('Pay due transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async markAsPaid(dueTransactionId: number): Promise<{ success: boolean; data?: DueTransaction; error?: string }> {
    try {
      const response = await apiClient.post(
        `/api/finance/due-transaction/${dueTransactionId}/mark-paid/`,
        {},
        { timeout: 30000 }
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to mark due transaction as paid' };
      }
    } catch (error) {
      console.error('Mark due transaction as paid error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createDueTransaction(data: DueTransactionCreate): Promise<{ success: boolean; data?: DueTransaction; error?: string }> {
    try {
      const response = await apiClient.post('/api/finance/due-transaction/create/', data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create due transaction' };
      }
    } catch (error) {
      console.error('Create due transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async generateDueTransactions(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post('/api/finance/due-transaction/generate/', {}, {
        timeout: 60000 // 60 seconds for generation
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to generate due transactions' };
      }
    } catch (error) {
      console.error('Generate due transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteDueTransaction(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/finance/due-transaction/${id}/delete/`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete due transaction' };
      }
    } catch (error) {
      console.error('Delete due transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async downloadInvoice(id: number): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/due-transaction/${id}/invoice/`, {
        responseType: 'blob',
        timeout: 60000 // 60 seconds for PDF generation
      });
      
      // Check if response is successful (status 200)
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to download invoice' };
      }
    } catch (error) {
      console.error('Download invoice error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateDueTransaction(id: number, data: any): Promise<{ success: boolean; data?: DueTransaction; error?: string }> {
    try {
      const response = await apiClient.put(`/api/finance/due-transaction/${id}/update/`, data, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update due transaction' };
      }
    } catch (error) {
      console.error('Update due transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const dueTransactionService = new DueTransactionService();

