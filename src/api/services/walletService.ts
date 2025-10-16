import { apiClient } from '../apiClient';
import type { Wallet, WalletListItem, WalletTopUpPayload } from '../../types/wallet';
import type { PaginatedResponse, PaginationParams } from '../../types/pagination';

class WalletService {
  async getAllWallets(): Promise<{ success: boolean; data?: WalletListItem[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/finance/wallet/wallets/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        // Transform balance from string to number
        const wallets = response.data.data.wallets.map((wallet: any) => ({
          ...wallet,
          balance: parseFloat(wallet.balance) || 0
        }));
        return { success: true, data: wallets };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch wallets' };
      }
    } catch (error) {
      console.error('Get wallets error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getWalletsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<WalletListItem>> {
    try {
      const { page = 1, page_size = 20, search = '' } = params;
      
      const response = await apiClient.get('/api/finance/wallet/wallets/', {
        params: { page, page_size, search },
        timeout: 30000
      });
      
      if (response.data.success) {
        const wallets = response.data.data.wallets.map((wallet: any) => ({
          ...wallet,
          balance: parseFloat(wallet.balance) || 0
        }));
        return {
          success: true,
          data: {
            items: wallets,
            pagination: response.data.data.pagination,
            search_query: response.data.data.search_query
          }
        };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getWalletByUser(userId: number): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/wallet/user/${userId}/`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch wallet' };
      }
    } catch (error) {
      console.error('Get wallet by user error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getWalletById(walletId: number): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const response = await apiClient.get(`/api/finance/wallet/${walletId}/`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch wallet' };
      }
    } catch (error) {
      console.error('Get wallet by ID error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createWallet(userId: number, balance: number = 0): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const response = await apiClient.post('/api/finance/wallet/create/', {
        user_id: userId,
        balance: balance
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create wallet' };
      }
    } catch (error) {
      console.error('Create wallet error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async updateWalletBalance(walletId: number, operation: 'add' | 'subtract' | 'set', amount: number): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const response = await apiClient.put(`/api/finance/wallet/${walletId}/operation/`, {
        operation,
        amount
      }, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update wallet balance' };
      }
    } catch (error) {
      console.error('Update wallet balance error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async deleteWallet(walletId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/finance/wallet/${walletId}/delete/`, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete wallet' };
      }
    } catch (error) {
      console.error('Delete wallet error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async topUpWallet(walletId: number, payload: WalletTopUpPayload): Promise<{ success: boolean; data?: Wallet; error?: string }> {
    try {
      const response = await apiClient.post(`/api/finance/wallet/${walletId}/topup/`, payload, {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to top up wallet' };
      }
    } catch (error) {
      console.error('Top up wallet error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getWalletSummary(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get('/api/finance/wallet/summary/', {
        timeout: 30000
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch wallet summary' };
      }
    } catch (error) {
      console.error('Get wallet summary error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const walletService = new WalletService();
