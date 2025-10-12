import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { walletService } from '../api/services/walletService';
import type { Wallet } from '../types/wallet';

interface UseWalletBalanceReturn {
  balance: number;
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  formatBalance: (amount?: number) => string;
}

export const useWalletBalance = (): UseWalletBalanceReturn => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) {
      setWallet(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await walletService.getWalletByUser(user.id);
      
      if (result.success && result.data) {
        setWallet(result.data);
      } else {
        setError(result.error || 'Failed to fetch wallet balance');
        setWallet(null);
      }
    } catch {
      setError('An unexpected error occurred while fetching wallet balance');
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshBalance = useCallback(async () => {
    await fetchWalletBalance();
  }, [fetchWalletBalance]);

  const formatBalance = useCallback((amount?: number) => {
    const balance = amount ?? wallet?.balance ?? 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  }, [wallet?.balance]);

  // Initial fetch
  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  // Auto-refresh when user changes
  useEffect(() => {
    if (user?.wallet) {
      setWallet({
        id: user.wallet.id,
        user: user.id,
        user_info: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          is_active: user.status === 'ACTIVE'
        },
        balance: user.wallet.balance,
        created_at: user.wallet.created_at,
        updated_at: user.wallet.updated_at
      });
    } else if (user?.id) {
      // If user exists but no wallet in user data, fetch it
      fetchWalletBalance();
    } else {
      setWallet(null);
    }
  }, [user, fetchWalletBalance]);

  return {
    balance: wallet?.balance ?? 0,
    wallet,
    loading,
    error,
    refreshBalance,
    formatBalance
  };
};
