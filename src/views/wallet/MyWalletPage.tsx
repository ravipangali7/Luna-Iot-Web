import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { transactionService } from '../../api/services/transactionService';
import type { TransactionListItem } from '../../types/transaction';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import { AuthContext } from '../../contexts/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';

const MyWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const { wallet, loading, error, refreshBalance, formatBalance } = useWalletBalance();
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    refreshBalance();
    loadTransactions();
  };

  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setTransactionsLoading(true);
      setTransactionsError(null);

      const result = await transactionService.getUserTransactions(user.id, 1, 10);

      if (result.success && result.data) {
        // Handle nested data structure from backend
        const transactionsData = Array.isArray(result.data) ? result.data : result.data.transactions || [];
        setTransactions(transactionsData);
      } else {
        setTransactionsError(result.error || 'Failed to load transactions');
      }
    } catch (error) {
      setTransactionsError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeBadge = (type: string) => {
    return type === 'CREDIT' ? 'success' : 'danger';
  };

  if (loading) {
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
                onClick={handleBack}
              >
                <ArrowBackIcon className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                <p className="text-gray-600">View your wallet details</p>
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
              onClick={handleBack}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-gray-600">View your wallet details and balance</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Balance Card */}
        <Card>
          <CardBody>
            <div className="text-center py-6">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {formatBalance()}
              </div>
              <p className="text-lg text-gray-600">Available Balance</p>
              {wallet && (
                <div className="mt-4">
                  <Badge variant="success" size="sm">
                    Active Wallet
                  </Badge>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Wallet Details */}
        {wallet && (
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                    <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Created On
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(wallet.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Last Updated
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(wallet.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardBody>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" color="primary" />
              </div>
            ) : transactionsError ? (
              <Alert variant="danger">
                {transactionsError}
              </Alert>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <AccountBalanceWalletIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h4>
                <p className="text-gray-500">
                  Your transaction history will appear here once you have wallet activity
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Balance After</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {formatDate(transaction.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTransactionTypeBadge(transaction.transaction_type)} size="sm">
                            {transaction.transaction_type_display}
                          </Badge>
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
                          <Badge 
                            variant={transaction.status === 'COMPLETED' ? 'success' : transaction.status === 'FAILED' ? 'danger' : 'warning'} 
                            size="sm"
                          >
                            {transaction.status_display}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

      </div>
    </Container>
  );
};

export default MyWalletPage;
