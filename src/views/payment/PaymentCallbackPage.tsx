import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../../api/services/paymentService';
import type { PaymentTransaction } from '../../types/payment';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

/**
 * Extract transaction ID from URL parameters.
 * Handles malformed URLs with double question marks and both TXNID/txn_id parameter names.
 */
const extractTransactionId = (searchParams: URLSearchParams, windowLocation?: Location): string | null => {
  // First, try standard URLSearchParams (works for normal URLs)
  let txnId = searchParams.get('txn_id') || searchParams.get('TXNID');
  
  if (txnId) {
    return txnId;
  }
  
  // If not found, try to parse the URL manually (handles malformed URLs like ?status=success?TXNID=...)
  if (windowLocation) {
    const fullUrl = windowLocation.href;
    const queryString = fullUrl.split('?')[1];
    
    if (queryString) {
      // Handle malformed URLs with double question marks
      // Example: ?status=success?TXNID=TXN-CC8952FECE23
      const parts = queryString.split('?');
      
      for (const part of parts) {
        // Try to find TXNID parameter
        const txnIdMatch = part.match(/TXNID=([^&?]+)/i);
        if (txnIdMatch && txnIdMatch[1]) {
          return decodeURIComponent(txnIdMatch[1]);
        }
        
        // Try to find txn_id parameter
        const txnIdLowerMatch = part.match(/txn_id=([^&?]+)/i);
        if (txnIdLowerMatch && txnIdLowerMatch[1]) {
          return decodeURIComponent(txnIdLowerMatch[1]);
        }
      }
    }
  }
  
  return null;
};

const PaymentCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract transaction ID with support for malformed URLs
        const txnId = extractTransactionId(searchParams, window.location);

        if (!txnId) {
          setError('Transaction ID is missing from callback URL');
          setLoading(false);
          return;
        }

        // Call backend validation endpoint to validate and process payment
        // The backend will validate with ConnectIPS and update wallet if successful
        const result = await paymentService.validatePayment({
          txn_id: txnId,
        });

        if (result.success && result.data) {
          setPayment(result.data);
        } else {
          setError(result.error || 'Failed to process payment callback');
        }
      } catch (err) {
        setError('An unexpected error occurred: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams]);

  const handleGoToWallet = () => {
    navigate('/my-wallet');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </Container>
    );
  }

  const isSuccess = payment?.status === 'SUCCESS';
  const isFailed = payment?.status === 'FAILED' || payment?.status === 'ERROR';

  return (
    <Container>
      <div className="flex flex-col items-center justify-center min-h-96 py-8">
        <Card className="max-w-md w-full">
          <CardBody>
            <div className="text-center space-y-6">
              {/* Status Icon */}
              {isSuccess && (
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircleIcon className="w-16 h-16 text-green-600" />
                  </div>
                </div>
              )}
              {(isFailed || error) && (
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-100 p-4">
                    <ErrorIcon className="w-16 h-16 text-red-600" />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isSuccess
                    ? 'Payment Successful!'
                    : isFailed
                    ? 'Payment Failed'
                    : error
                    ? 'Payment Error'
                    : 'Payment Processing'}
                </h1>
                <p className="text-gray-600">
                  {isSuccess
                    ? 'Your wallet has been topped up successfully.'
                    : isFailed
                    ? payment?.error_message || 'Your payment could not be processed.'
                    : error || 'An error occurred while processing your payment.'}
                </p>
              </div>

              {/* Payment Details */}
              {payment && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="text-sm font-semibold text-gray-900">{payment.txn_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      variant={
                        payment.status === 'SUCCESS'
                          ? 'success'
                          : payment.status === 'FAILED' || payment.status === 'ERROR'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {payment.status_display}
                    </Badge>
                  </div>
                  {payment.completed_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed:</span>
                      <span className="text-sm text-gray-900">{formatDate(payment.completed_at)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && !payment && (
                <Alert variant="danger">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <Button variant="success" onClick={handleGoToWallet} className="w-full">
                  <AccountBalanceWalletIcon className="w-4 h-4 mr-2" />
                  Go to My Wallet
                </Button>
                {!isSuccess && (
                <Button variant="outline" onClick={() => navigate('/my-wallet')} className="w-full">
                  Try Again
                </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default PaymentCallbackPage;

