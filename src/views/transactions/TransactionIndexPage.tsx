import React, { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../../api/services/transactionService';
import type { TransactionListItem, TransactionFilter } from '../../types/transaction';
import type { PaginationInfo } from '../../types/pagination';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
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
import Pagination from '../../components/ui/pagination/Pagination';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const TransactionIndexPage: React.FC = () => {
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
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
  
  const [filters, setFilters] = useState<TransactionFilter>({
    transaction_type: undefined,
    status: undefined,
    page_size: 50
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await transactionService.getTransactionsPaginated({
        page: currentPage,
        page_size: 20,
        search: searchQuery
      });

      if (result.success && result.data) {
        setFilteredTransactions(result.data.items);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load transactions');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page when clearing search
  };

  const handleFilterChange = (key: keyof TransactionFilter, value: string | number | undefined) => {
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
    loadTransactions();
  }, [loadTransactions]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
            <p className="text-gray-600">View and manage all wallet transactions</p>
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

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by user name, phone, or description..."
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

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={filters.status || ''}
                  onChange={handleSelectChange('status')}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'FAILED', label: 'Failed' }
                  ]}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardBody>
            {error ? (
              <Alert variant="danger">
                {error}
              </Alert>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h4>
                <p className="text-gray-500">
                  {searchQuery ? 'No transactions match your search criteria' : 'No transactions available yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>ID</TableHeader>
                      <TableHeader>User</TableHeader>
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
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.user_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.user_phone || 'N/A'}
                            </div>
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
            Showing {filteredTransactions.length} of {pagination.total_items} transactions
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
            hasNext={pagination.has_next}
            hasPrevious={pagination.has_previous}
            totalItems={pagination.total_items}
            pageSize={pagination.page_size}
          />
        )}
      </div>
    </Container>
  );
};

export default TransactionIndexPage;
