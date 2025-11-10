import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { 
  Transaction, 
  TransactionListItem, 
  TransactionFilter, 
  TransactionSummary,
  TransactionCreatePayload 
} from '../../types/transaction';
import type { PaginatedResponse, PaginationParams } from '../../types/pagination';

class TransactionService {
  async getAllTransactions(filters?: TransactionFilter): Promise<{ success: boolean; data?: { transactions: TransactionListItem[]; pagination: any }; error?: string }> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/api/finance/transaction/transactions?${params.toString()}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch transactions' };
      }
    } catch (error) {
      console.error('Get all transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getTransactionsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<TransactionListItem>> {
    try {
      const { page = 1, page_size = 20, search = '' } = params;
      
      const response = await apiClient.get('/api/finance/transaction/transactions', {
        params: { page, page_size, search },
        timeout: 30000
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            items: response.data.data.transactions,
            pagination: response.data.data.pagination,
            search_query: response.data.data.search_query
          }
        };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getTransactionById(transactionId: number): Promise<{ success: boolean; data?: Transaction; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/transaction/transaction/${transactionId}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch transaction' };
      }
    } catch (error) {
      console.error('Get transaction by ID error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getWalletTransactions(walletId: number, page: number = 1, pageSize: number = 20): Promise<{ success: boolean; data?: { transactions: TransactionListItem[]; pagination: any; wallet_id: number; wallet_owner: any }; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/transaction/wallet/${walletId}/transactions?page=${page}&page_size=${pageSize}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch wallet transactions' };
      }
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getUserTransactions(userId: number, page: number = 1, pageSize: number = 20): Promise<{ success: boolean; data?: { transactions: TransactionListItem[]; pagination: any; user_id: number; user_name: string; user_phone: string; wallet_id: number }; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/transaction/user/${userId}/transactions?page=${page}&page_size=${pageSize}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch user transactions' };
      }
    } catch (error) {
      console.error('Get user transactions error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createTransaction(payload: TransactionCreatePayload): Promise<{ success: boolean; data?: Transaction; error?: string }> {
    try {
      const response = await apiClient.post('/api/finance/transaction/transaction/create', payload);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create transaction' };
      }
    } catch (error) {
      console.error('Create transaction error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getTransactionSummary(days: number = 30): Promise<{ success: boolean; data?: TransactionSummary; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/transaction/summary?days=${days}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch transaction summary' };
      }
    } catch (error) {
      console.error('Get transaction summary error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Helper method to format transaction type for display
  formatTransactionType(type: 'CREDIT' | 'DEBIT'): { label: string; color: string; icon: string } {
    if (type === 'CREDIT') {
      return {
        label: 'Credit',
        color: 'text-green-600 bg-green-100',
        icon: '↗'
      };
    } else {
      return {
        label: 'Debit',
        color: 'text-red-600 bg-red-100',
        icon: '↘'
      };
    }
  }

  // Helper method to format transaction status
  formatTransactionStatus(status: 'PENDING' | 'COMPLETED' | 'FAILED'): { label: string; color: string } {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', color: 'text-green-600 bg-green-100' };
      case 'PENDING':
        return { label: 'Pending', color: 'text-yellow-600 bg-yellow-100' };
      case 'FAILED':
        return { label: 'Failed', color: 'text-red-600 bg-red-100' };
      default:
        return { label: status, color: 'text-gray-600 bg-gray-100' };
    }
  }

  // Helper method to format amount with sign
  formatAmount(amount: number, type: 'CREDIT' | 'DEBIT'): string {
    const sign = type === 'CREDIT' ? '+' : '-';
    return `${sign}₹${amount.toFixed(2)}`;
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}

export const transactionService = new TransactionService();
