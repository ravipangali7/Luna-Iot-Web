import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dueTransactionService } from '../../api/services/dueTransactionService';
import { useAuth } from '../../hooks/useAuth';
import { showSuccess, showError, showConfirm } from '../../utils/sweetAlert';
import type { DueTransactionListItem } from '../../types/dueTransaction';
import type { PaginationInfo } from '../../types/pagination';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { ActionButton, ActionButtonGroup } from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Pagination from '../../components/ui/pagination/Pagination';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { confirmDelete } from '../../utils/sweetAlert';

const DueTransactionIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.some(role => role.name === 'Super Admin') || false;
  
  const [dueTransactions, setDueTransactions] = useState<DueTransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isPaidFilter, setIsPaidFilter] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 20,
    has_next: false,
    has_previous: false
  });
  
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadDueTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        page_size: 20,
        search: searchQuery
      };
      
      if (isPaidFilter !== '') {
        params.is_paid = isPaidFilter === 'true';
      }

      const result = isSuperAdmin
        ? await dueTransactionService.getAllDueTransactions(params)
        : await dueTransactionService.getMyDueTransactions(params);

      if (result.success && result.data) {
        setDueTransactions(result.data.items);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load due transactions');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, isPaidFilter, isSuperAdmin]);

  useEffect(() => {
    loadDueTransactions();
  }, [loadDueTransactions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleView = (id: number) => {
    navigate(`/due-transactions/${id}`);
  };

  const handlePayWithWallet = async (id: number, total: number) => {
    const confirmed = await showConfirm(
      'Pay Due Transaction',
      `Are you sure you want to pay Rs. ${(typeof total === 'string' ? parseFloat(total) : total || 0).toFixed(2)} from your wallet?`,
      'warning'
    );
    
    if (!confirmed) return;

    try {
      setProcessingId(id);
      const result = await dueTransactionService.payWithWallet(id);
      
      if (result.success) {
        showSuccess('Payment Successful', 'Due transaction has been paid successfully.');
        loadDueTransactions();
      } else {
        showError('Payment Failed', result.error || 'Failed to process payment');
      }
    } catch (error) {
      showError('Payment Error', 'An unexpected error occurred during payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    const confirmed = await showConfirm(
      'Mark as Paid',
      'Are you sure you want to mark this due transaction as paid? This will not create a wallet transaction.',
      'warning'
    );
    
    if (!confirmed) return;

    try {
      setProcessingId(id);
      const result = await dueTransactionService.markAsPaid(id);
      
      if (result.success) {
        showSuccess('Updated', 'Due transaction has been marked as paid.');
        loadDueTransactions();
      } else {
        showError('Update Failed', result.error || 'Failed to mark as paid');
      }
    } catch (error) {
      showError('Update Error', 'An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateDues = async () => {
    const confirmed = await showConfirm(
      'Generate Due Transactions',
      'This will check for expired vehicles and institutional modules and create due transactions. Continue?',
      'warning'
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const result = await dueTransactionService.generateDueTransactions();
      
      if (result.success) {
        showSuccess('Success', 'Due transactions generated successfully');
        loadDueTransactions();
      } else {
        showError('Error', result.error || 'Failed to generate due transactions');
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete(
      'Delete Due Transaction',
      'Are you sure you want to delete this due transaction? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      setProcessingId(id);
      const result = await dueTransactionService.deleteDueTransaction(id);
      
      if (result.success) {
        showSuccess('Deleted', 'Due transaction deleted successfully');
        loadDueTransactions();
      } else {
        showError('Delete Failed', result.error || 'Failed to delete due transaction');
      }
    } catch (error) {
      showError('Delete Error', 'An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadInvoice = async (id: number) => {
    try {
      setProcessingId(id);
      const result = await dueTransactionService.downloadInvoice(id);
      
      if (result.success && result.data) {
        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccess('Downloaded', 'Invoice downloaded successfully');
      } else {
        showError('Download Failed', result.error || 'Failed to download invoice');
      }
    } catch (error) {
      showError('Download Error', 'An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/due-transactions/${id}/edit`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return 'Rs. 0.00';
    }
    return `Rs. ${numAmount.toFixed(2)}`;
  };

  return (
    <Container>
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1>Due Transactions</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {isSuperAdmin && (
                <Button
                  variant="primary"
                  onClick={handleGenerateDues}
                  disabled={loading || processingId !== null}
                >
                  <PlayArrowIcon style={{ marginRight: '0.5rem' }} />
                  Generate Dues
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={loadDueTransactions}
                disabled={loading}
              >
                <RefreshIcon style={{ marginRight: '0.5rem' }} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '0.5rem' }}>
              <Input
                type="text"
                placeholder="Search by user name, phone, or ID..."
                value={searchInput}
                onChange={(value) => setSearchInput(value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="primary">Search</Button>
              {searchQuery && (
                <Button type="button" variant="secondary" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </form>
            
            <Select
              value={isPaidFilter}
              onChange={(value) => {
                setIsPaidFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'false', label: 'Unpaid' },
                { value: 'true', label: 'Paid' }
              ]}
              style={{ minWidth: '150px' }}
            />
          </div>

          {error && (
            <Alert variant="error" style={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          ) : dueTransactions.length === 0 ? (
            <Alert variant="info">
              No due transactions found.
            </Alert>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>User</TableHeader>
                    <TableHeader>Subtotal</TableHeader>
                    <TableHeader>VAT</TableHeader>
                    <TableHeader>Total</TableHeader>
                    <TableHeader>Renew Date</TableHeader>
                    <TableHeader>Expire Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Particulars</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dueTransactions.map((due) => (
                    <TableRow key={due.id}>
                      <TableCell>#{due.id}</TableCell>
                      <TableCell>
                        <div>
                          <div>{due.user_name || 'N/A'}</div>
                          <small style={{ color: '#666' }}>{due.user_phone}</small>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(due.subtotal)}</TableCell>
                      <TableCell>{formatCurrency(due.vat)}</TableCell>
                      <TableCell><strong>{formatCurrency(due.total)}</strong></TableCell>
                      <TableCell>{formatDate(due.renew_date)}</TableCell>
                      <TableCell>{formatDate(due.expire_date)}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            backgroundColor: due.is_paid ? '#d4edda' : '#f8d7da',
                            color: due.is_paid ? '#155724' : '#721c24'
                          }}
                        >
                          {due.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </TableCell>
                      <TableCell>{due.particulars_count}</TableCell>
                      <TableCell>
                        <ActionButtonGroup>
                          <ActionButton
                            onClick={() => handleView(due.id)}
                            title="View Details"
                          >
                            <VisibilityIcon />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleDownloadInvoice(due.id)}
                            title="Download Invoice"
                            disabled={processingId === due.id}
                          >
                            <DownloadIcon />
                          </ActionButton>
                          {isSuperAdmin && (
                            <ActionButton
                              onClick={() => handleEdit(due.id)}
                              title="Edit"
                            >
                              <EditIcon />
                            </ActionButton>
                          )}
                          {!due.is_paid && (
                            <>
                              {!isSuperAdmin && (
                                <ActionButton
                                  onClick={() => handlePayWithWallet(due.id, due.total)}
                                  title="Pay with Wallet"
                                  disabled={processingId === due.id}
                                >
                                  <PaymentIcon />
                                </ActionButton>
                              )}
                              {isSuperAdmin && (
                                <>
                                  <ActionButton
                                    onClick={() => handleMarkAsPaid(due.id)}
                                    title="Mark as Paid"
                                    disabled={processingId === due.id}
                                  >
                                    <CheckCircleIcon />
                                  </ActionButton>
                                  <ActionButton
                                    onClick={() => handleDelete(due.id)}
                                    title="Delete"
                                    disabled={processingId === due.id}
                                  >
                                    <DeleteIcon />
                                  </ActionButton>
                                </>
                              )}
                            </>
                          )}
                        </ActionButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={pagination.current_page || currentPage}
                totalPages={pagination.total_pages || 1}
                onPageChange={handlePageChange}
                hasNext={pagination.has_next || false}
                hasPrevious={pagination.has_previous || false}
                totalItems={pagination.total_items || 0}
                pageSize={pagination.page_size || 20}
              />
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default DueTransactionIndexPage;

