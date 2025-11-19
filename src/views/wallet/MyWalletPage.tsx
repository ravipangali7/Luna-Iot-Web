import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { transactionService } from '../../api/services/transactionService';
import { paymentService } from '../../api/services/paymentService';
import type { TransactionListItem } from '../../types/transaction';
import type { PaymentFormData } from '../../types/payment';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Modal from '../../components/ui/common/Modal';
import Input from '../../components/ui/forms/Input';
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
import AddIcon from '@mui/icons-material/Add';

const MyWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const { wallet, loading, error, refreshBalance, formatBalance } = useWalletBalance();
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  
  // Top Up Payment State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [topUpRemarks, setTopUpRemarks] = useState<string>('');
  const [topUpParticulars, setTopUpParticulars] = useState<string>('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(0);
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(numAmount);
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeBadge = (type: string) => {
    return type === 'CREDIT' ? 'success' : 'danger';
  };

  const handleTopUpClick = () => {
    setShowTopUpModal(true);
    setTopUpAmount('');
    setTopUpRemarks('');
    setTopUpParticulars('');
    setTopUpError(null);
  };

  const handleCloseTopUpModal = () => {
    setShowTopUpModal(false);
    setTopUpAmount('');
    setTopUpRemarks('');
    setTopUpParticulars('');
    setTopUpError(null);
  };

  const handleInitiatePayment = async () => {
    const amount = parseFloat(topUpAmount);
    
    if (!amount || amount <= 0) {
      setTopUpError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setTopUpLoading(true);
      setTopUpError(null);

      const result = await paymentService.initiatePayment({
        amount: amount,
        remarks: topUpRemarks || 'Wallet top-up',
        particulars: topUpParticulars || 'User deposit',
      });

      if (result.success && result.data) {
        const formData = result.data;
        
        // Validate form data before submission
        if (!formData.gateway_url) {
          setTopUpError('Gateway URL is missing');
          return;
        }
        
        // Validate required fields
        const requiredFields = ['MERCHANTID', 'APPID', 'APPNAME', 'TXNID', 'TXNDATE', 'TXNAMT', 'TOKEN'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof PaymentFormData]);
        
        if (missingFields.length > 0) {
          setTopUpError(`Missing required fields: ${missingFields.join(', ')}`);
          return;
        }
        
        // Close modal before redirecting
        setShowTopUpModal(false);
        
        // Small delay to ensure modal closes, then submit form
        setTimeout(() => {
          submitPaymentForm(formData);
        }, 100);
      } else {
        setTopUpError(result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      setTopUpError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const submitPaymentForm = (formData: PaymentFormData) => {
    // Create a form element for NCHL ConnectIPS
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = formData.gateway_url;
    form.enctype = 'application/x-www-form-urlencoded';
    form.style.display = 'none';
    form.target = '_self'; // Submit in same window

    // Add all required form fields (excluding metadata fields)
    const fieldsToExclude = ['gateway_url', 'success_url', 'failure_url'];
    
    Object.entries(formData).forEach(([key, value]) => {
      if (!fieldsToExclude.includes(key)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
    });

    // Append form to body
    document.body.appendChild(form);
    
    // Log for debugging (remove in production)
    console.log('Submitting payment form to:', formData.gateway_url);
    console.log('Form fields:', Array.from(form.querySelectorAll('input')).map((inp: HTMLInputElement) => ({
      name: inp.name,
      value: inp.value.substring(0, 50) + (inp.value.length > 50 ? '...' : '')
    })));

    // Submit the form
    form.submit();
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
                <div className="mt-4 flex justify-center items-center gap-3">
                  <Badge variant="success" size="sm">
                    Active Wallet
                  </Badge>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleTopUpClick}
                    className="flex items-center gap-2"
                  >
                    <AddIcon className="w-4 h-4" />
                    Top Up
                  </Button>
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

        {/* Top Up Modal */}
        <Modal
          isOpen={showTopUpModal}
          onClose={handleCloseTopUpModal}
          title="Top Up Wallet"
        >
          <div className="space-y-4">
            {topUpError && (
              <Alert variant="danger">
                {topUpError}
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={topUpAmount}
                onChange={(value) => setTopUpAmount(value)}
                placeholder="Enter amount"
                disabled={topUpLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum amount: ₹0.01
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (Optional)
              </label>
              <Input
                type="text"
                value={topUpRemarks}
                onChange={(value) => setTopUpRemarks(value)}
                placeholder="e.g., Wallet top-up"
                disabled={topUpLoading}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Particulars (Optional)
              </label>
              <Input
                type="text"
                value={topUpParticulars}
                onChange={(value) => setTopUpParticulars(value)}
                placeholder="e.g., User deposit"
                disabled={topUpLoading}
                maxLength={100}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseTopUpModal}
                disabled={topUpLoading}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleInitiatePayment}
                disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                loading={topUpLoading}
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </Container>
  );
};

export default MyWalletPage;
