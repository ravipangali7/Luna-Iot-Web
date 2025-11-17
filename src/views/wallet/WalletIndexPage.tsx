import React, { useState, useEffect, useCallback } from 'react';
import { walletService } from '../../api/services/walletService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { WalletListItem, WalletBalanceUpdate, WalletTopUpPayload } from '../../types/wallet';
import type { PaginationInfo } from '../../types/pagination';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { ActionButton, ActionButtonGroup } from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Modal from '../../components/ui/common/Modal';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Pagination from '../../components/ui/pagination/Pagination';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';

const WalletIndexPage: React.FC = () => {
  const [, setWallets] = useState<WalletListItem[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<WalletListItem[]>([]);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletListItem | null>(null);
  const [editFormData, setEditFormData] = useState<WalletBalanceUpdate>({
    operation: 'set',
    amount: 0
  });
  const [editLoading, setEditLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpWallet, setTopUpWallet] = useState<WalletListItem | null>(null);
  const [topUpFormData, setTopUpFormData] = useState<WalletTopUpPayload>({
    operation: 'add',
    amount: 0,
    description: ''
  });
  const [topUpLoading, setTopUpLoading] = useState(false);

  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await walletService.getWalletsPaginated({
        page: currentPage,
        page_size: 20,
        search: searchQuery
      });

      if (result.success && result.data) {
        setWallets(result.data.items);
        setFilteredWallets(result.data.items);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load wallets');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);


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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditWallet = (wallet: WalletListItem) => {
    setEditingWallet(wallet);
    setEditFormData({
      operation: 'set',
      amount: wallet.balance
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingWallet) return;

    try {
      setEditLoading(true);

      const result = await walletService.updateWalletBalance(
        editingWallet.id,
        editFormData.operation,
        editFormData.amount
      );

      if (result.success) {
        showSuccess('Wallet balance updated successfully');
        setShowEditModal(false);
        loadWallets();
      } else {
        showError('Failed to update wallet balance', result.error);
      }
    } catch (error) {
      showError('Error updating wallet balance', (error as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingWallet(null);
    setEditFormData({
      operation: 'set',
      amount: 0
    });
  };

  const handleTopUpWallet = (wallet: WalletListItem) => {
    setTopUpWallet(wallet);
    setTopUpFormData({
      operation: 'add',
      amount: 0,
      description: ''
    });
    setShowTopUpModal(true);
  };

  const handleTopUpSubmit = async () => {
    if (!topUpWallet) return;

    try {
      setTopUpLoading(true);

      const result = await walletService.topUpWallet(topUpWallet.id, topUpFormData);

      if (result.success) {
        showSuccess('Wallet topped up successfully');
        setShowTopUpModal(false);
        loadWallets();
      } else {
        showError('Failed to top up wallet', result.error);
      }
    } catch (error) {
      showError('Error topping up wallet', (error as Error).message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleCloseTopUpModal = () => {
    setShowTopUpModal(false);
    setTopUpWallet(null);
    setTopUpFormData({
      operation: 'add',
      amount: 0,
      description: ''
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

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'add':
        return 'Add to balance';
      case 'subtract':
        return 'Subtract from balance';
      case 'set':
        return 'Set balance to';
      default:
        return operation;
    }
  };

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
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
            <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
            <p className="text-gray-600">Manage user wallet balances</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadWallets} variant="outline" icon={<RefreshIcon className="w-4 h-4" />}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search wallets by user name or phone..."
                    value={searchInput}
                    onChange={setSearchInput}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="outline"
                  >
                    Clear
                  </Button>
                )}
              </form>
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Wallets Table */}
        <Card>
            {filteredWallets.length === 0 ? (
              <div className="text-center py-8">
                <AccountBalanceWalletIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No wallets found matching your search.' : 'No wallets found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>User Name</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>Balance</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredWallets.map((wallet) => (
                      <TableRow key={wallet.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {wallet.user_name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600">
                            {wallet.user_phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-base text-gray-900">
                            {formatCurrency(wallet.balance)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {wallet.created_at ? new Date(wallet.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionButtonGroup>
                            <ActionButton
                              onClick={() => handleTopUpWallet(wallet)}
                              variant="success"
                              size="sm"
                              title="Top Up Wallet"
                              icon={<AccountBalanceWalletIcon className="w-4 h-4" />}
                            />
                            <ActionButton
                              onClick={() => handleEditWallet(wallet)}
                              variant="warning"
                              size="sm"
                              title="Edit Balance"
                              icon={<EditIcon className="w-4 h-4" />}
                            />
                          </ActionButtonGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </Card>

        {/* Summary */}
        {filteredWallets.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Showing {filteredWallets.length} of {pagination.total_items} wallets
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

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseModal}
          title="Edit Wallet Balance"
        >
          {editingWallet && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{editingWallet.user_name}</h4>
                <p className="text-sm text-gray-600">{editingWallet.user_phone}</p>
                <p className="text-lg font-semibold text-green-600 mt-2">
                  Current Balance: {formatCurrency(editingWallet.balance)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operation
                  </label>
                  <Select
                    value={editFormData.operation}
                    onChange={(value) => setEditFormData(prev => ({
                      ...prev,
                      operation: value as 'add' | 'subtract' | 'set'
                    }))}
                    options={[
                      { value: 'set', label: 'Set balance to' },
                      { value: 'add', label: 'Add to balance' },
                      { value: 'subtract', label: 'Subtract from balance' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.amount.toString()}
                    onChange={(value) => setEditFormData(prev => ({
                      ...prev,
                      amount: parseFloat(value) || 0
                    }))}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> {getOperationLabel(editFormData.operation)} {formatCurrency(editFormData.amount)}
                    {editFormData.operation === 'add' && (
                      <span> = {formatCurrency(editingWallet.balance + editFormData.amount)}</span>
                    )}
                    {editFormData.operation === 'subtract' && (
                      <span> = {formatCurrency(Math.max(0, editingWallet.balance - editFormData.amount))}</span>
                    )}
                    {editFormData.operation === 'set' && (
                      <span> = {formatCurrency(editFormData.amount)}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  variant="primary"
                  disabled={editLoading}
                  className="flex items-center gap-2"
                >
                  {editLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <EditIcon className="w-4 h-4" />
                  )}
                  {editLoading ? 'Updating...' : 'Update Balance'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Top-Up Modal */}
        <Modal
          isOpen={showTopUpModal}
          onClose={handleCloseTopUpModal}
          title="Top Up Wallet"
        >
          {topUpWallet && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{topUpWallet.user_name}</h4>
                <p className="text-sm text-gray-600">{topUpWallet.user_phone}</p>
                <p className="text-lg font-semibold text-green-600 mt-2">
                  Current Balance: {formatCurrency(topUpWallet.balance)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operation
                  </label>
                  <Select
                    value={topUpFormData.operation}
                    onChange={(value) => setTopUpFormData(prev => ({
                      ...prev,
                      operation: value as 'add' | 'subtract'
                    }))}
                    options={[
                      { value: 'add', label: 'Add to balance' },
                      { value: 'subtract', label: 'Subtract from balance' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={topUpFormData.amount.toString()}
                    onChange={(value) => setTopUpFormData(prev => ({
                      ...prev,
                      amount: parseFloat(value) || 0
                    }))}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={topUpFormData.description}
                    onChange={(e) => setTopUpFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter description for this transaction"
                  />
                </div>

                {/* Balance Preview */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">New Balance:</span>{' '}
                    {topUpFormData.operation === 'add' ? (
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(topUpWallet.balance + (topUpFormData.amount || 0))}
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        {formatCurrency(topUpWallet.balance - (topUpFormData.amount || 0))}
                      </span>
                    )}
                    {' '}({topUpFormData.operation === 'add' ? '+' : '-'}{formatCurrency(topUpFormData.amount || 0)})
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCloseTopUpModal}
                  variant="outline"
                  disabled={topUpLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTopUpSubmit}
                  variant="success"
                  disabled={topUpLoading || !topUpFormData.amount || !topUpFormData.description}
                  className="flex items-center gap-2"
                >
                  {topUpLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <AccountBalanceWalletIcon className="w-4 h-4" />
                  )}
                  {topUpLoading ? 'Processing...' : 'Top Up Wallet'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Container>
  );
};

export default WalletIndexPage;
