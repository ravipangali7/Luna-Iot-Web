import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionService } from '../../api/services/transactionService';
import { walletService } from '../../api/services/walletService';
import type { TransactionListItem, TransactionFilter } from '../../types/transaction';
import type { Wallet } from '../../types/wallet';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const WalletTransactionsPage: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<TransactionFilter>({
    wallet_id: walletId ? parseInt(walletId) : undefined,
    page_size: 50
  });

  const loadWallet = useCallback(async () => {
    if (!walletId) return;

    try {
      setWalletLoading(true);
      const result = await walletService.getWalletById(parseInt(walletId));

      if (result.success && result.data) {
        setWallet(result.data);
      } else {
        setError(result.error || 'Failed to load wallet details');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setWalletLoading(false);
    }
  }, [walletId]);

  const loadTransactions = useCallback(async () => {
    if (!walletId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await transactionService.getWalletTransactions(parseInt(walletId), 1, 50);

      if (result.success && result.data) {
        // Handle nested data structure from backend
        const transactionsData = Array.isArray(result.data) ? result.data : result.data.transactions || [];
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } else {
        setError(result.error || 'Failed to load transactions');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [walletId, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...transactions];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleSelectChange = (key: keyof TransactionFilter) => (value: string) => {
    handleFilterChange(key, value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeBadge = (type: string) => {
    return type === 'CREDIT' ? 'success' : 'danger';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'PENDING':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (walletLoading || loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowBackIcon className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wallet Transactions</h1>
                <p className="text-gray-600">View transactions for this wallet</p>
              </div>
            </div>
          </div>
          <Alert variant="danger">
            {error}
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallet Transactions</h1>
              <p className="text-gray-600">View transactions for this wallet</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactions}
            className="flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Wallet Info */}
        {wallet && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AccountBalanceWalletIcon className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Wallet Information</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Wallet ID
                  </label>
                  <p className="text-lg font-semibold text-gray-900">#{wallet.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Account Holder
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{wallet.user_info.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Balance
                  </label>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(wallet.balance)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by description..."
                      value={searchInput}
                      onChange={setSearchInput}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm">
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSearch}
                    >
                      Clear
                    </Button>
                  )}
                </form>
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <Select
                  value={filters.transaction_type || ''}
                  onChange={handleSelectChange('transaction_type')}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'CREDIT', label: 'Credit' },
                    { value: 'DEBIT', label: 'Debit' }
                  ]}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Transactions ({filteredTransactions.length})
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            {error ? (
              <Alert variant="danger">
                {error}
              </Alert>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <AccountBalanceWalletIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h4>
                <p className="text-gray-500">
                  {searchQuery ? 'No transactions match your search criteria' : 'No transactions available for this wallet yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>ID</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Balance After</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Date</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="font-mono text-sm text-gray-600">
                            #{transaction.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.transaction_type === 'CREDIT' ? (
                              <TrendingUpIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDownIcon className="w-4 h-4 text-red-600" />
                            )}
                            <Badge variant={getTransactionTypeBadge(transaction.transaction_type)} size="sm">
                              {transaction.transaction_type_display}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                            {transaction.transaction_type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(transaction.balance_after)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {transaction.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(transaction.status)} size="sm">
                            {transaction.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {formatDate(transaction.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Showing {filteredTransactions.length} of {transactions.length} transactions
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    </Container>
  );
};

export default WalletTransactionsPage;
