import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dueTransactionService } from '../../api/services/dueTransactionService';
import { useAuth } from '../../hooks/useAuth';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import type { DueTransaction } from '../../types/dueTransaction';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';

const DueTransactionShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.some(role => role.name === 'Super Admin') || false;
  
  const [dueTransaction, setDueTransaction] = useState<DueTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadDueTransaction();
    }
  }, [id]);

  const loadDueTransaction = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await dueTransactionService.getDueTransactionById(parseInt(id));
      
      if (result.success && result.data) {
        setDueTransaction(result.data);
      } else {
        setError(result.error || 'Failed to load due transaction');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (!dueTransaction) return;
    
    const totalAmount = typeof dueTransaction.total === 'string' ? parseFloat(dueTransaction.total) : dueTransaction.total;
    const confirmed = await showConfirm(
      'Pay Due Transaction',
      `Are you sure you want to pay Rs. ${(isNaN(totalAmount) ? 0 : totalAmount).toFixed(2)} from your wallet?`,
      'warning'
    );
    
    if (!confirmed) return;

    try {
      setProcessing(true);
      const result = await dueTransactionService.payWithWallet(dueTransaction.id);
      
      if (result.success) {
        showSuccess('Payment Successful', 'Due transaction has been paid successfully.');
        loadDueTransaction();
      } else {
        showError('Payment Failed', result.error || 'Failed to process payment');
      }
    } catch (error) {
      showError('Payment Error', 'An unexpected error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!dueTransaction) return;
    
    try {
      setProcessing(true);
      const result = await dueTransactionService.downloadInvoice(dueTransaction.id);
      
      if (result.success && result.data) {
        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${dueTransaction.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccess('Downloaded', 'Invoice downloaded successfully');
      } else {
        showError('Download Failed', result.error || 'Failed to download invoice');
      }
    } catch (error) {
      showError('Download Error', 'An unexpected error occurred during download');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!dueTransaction) return;
    
    const confirmed = await showConfirm(
      'Mark as Paid',
      'Are you sure you want to mark this due transaction as paid? This will not create a wallet transaction.',
      'warning'
    );
    
    if (!confirmed) return;

    try {
      setProcessing(true);
      const result = await dueTransactionService.markAsPaid(dueTransaction.id);
      
      if (result.success) {
        showSuccess('Updated', 'Due transaction has been marked as paid.');
        loadDueTransaction();
      } else {
        showError('Update Failed', result.error || 'Failed to mark as paid');
      }
    } catch (error) {
      showError('Update Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return 'Rs. 0.00';
    }
    return `Rs. ${numAmount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (error || !dueTransaction) {
    return (
      <Container>
        <Card>
          <CardBody>
            <Alert variant="error">{error || 'Due transaction not found'}</Alert>
            <Button
              variant="secondary"
              onClick={() => navigate('/due-transactions')}
              style={{ marginTop: '1rem' }}
            >
              <ArrowBackIcon style={{ marginRight: '0.5rem' }} />
              Back to List
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1>Due Transaction #{dueTransaction.id}</h1>
            <Button
              variant="secondary"
              onClick={() => navigate('/due-transactions')}
            >
              <ArrowBackIcon style={{ marginRight: '0.5rem' }} />
              Back to List
            </Button>
          </div>

          {/* Transaction Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Transaction Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>User:</strong>
                <div>{dueTransaction.user_info.name || 'N/A'}</div>
                <small style={{ color: '#666' }}>{dueTransaction.user_info.phone}</small>
              </div>
              <div>
                <strong>Status:</strong>
                <div>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      backgroundColor: dueTransaction.is_paid ? '#d4edda' : '#f8d7da',
                      color: dueTransaction.is_paid ? '#155724' : '#721c24'
                    }}
                  >
                    {dueTransaction.is_paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
              <div>
                <strong>Subtotal:</strong>
                <div>{formatCurrency(dueTransaction.subtotal)}</div>
              </div>
              <div>
                <strong>VAT:</strong>
                <div>{formatCurrency(dueTransaction.vat)}</div>
              </div>
              <div>
                <strong>Total:</strong>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {formatCurrency(dueTransaction.total)}
                </div>
              </div>
              <div>
                <strong>Renew Date:</strong>
                <div>{formatDate(dueTransaction.renew_date)}</div>
              </div>
              <div>
                <strong>Expire Date:</strong>
                <div>{formatDate(dueTransaction.expire_date)}</div>
              </div>
              {dueTransaction.pay_date && (
                <div>
                  <strong>Payment Date:</strong>
                  <div>{formatDate(dueTransaction.pay_date)}</div>
                </div>
              )}
              <div>
                <strong>Created At:</strong>
                <div>{formatDate(dueTransaction.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                onClick={handleDownloadInvoice}
                disabled={processing}
              >
                <DownloadIcon style={{ marginRight: '0.5rem' }} />
                Download Invoice
              </Button>
              {!dueTransaction.is_paid && (
                <>
                  {!isSuperAdmin && (
                    <Button
                      variant="primary"
                      onClick={handlePayWithWallet}
                      disabled={processing}
                    >
                      <PaymentIcon style={{ marginRight: '0.5rem' }} />
                      Pay with Wallet
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button
                      variant="success"
                      onClick={handleMarkAsPaid}
                      disabled={processing}
                    >
                      <CheckCircleIcon style={{ marginRight: '0.5rem' }} />
                      Mark as Paid
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Particulars */}
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Particulars</h2>
            {dueTransaction.particulars.length === 0 ? (
              <Alert variant="info">No particulars found.</Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Particular</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Institute</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Quantity</TableHeader>
                    <TableHeader>Total</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dueTransaction.particulars.map((particular) => (
                    <TableRow key={particular.id}>
                      <TableCell>{particular.particular}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            backgroundColor: particular.type === 'vehicle' ? '#e3f2fd' : '#f3e5f5',
                            color: particular.type === 'vehicle' ? '#1976d2' : '#7b1fa2',
                            textTransform: 'capitalize'
                          }}
                        >
                          {particular.type}
                        </span>
                      </TableCell>
                      <TableCell>{particular.institute_name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(particular.amount)}</TableCell>
                      <TableCell>{particular.quantity}</TableCell>
                      <TableCell><strong>{formatCurrency(particular.total)}</strong></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardBody>
      </Card>
    </Container>
  );
};

export default DueTransactionShowPage;

