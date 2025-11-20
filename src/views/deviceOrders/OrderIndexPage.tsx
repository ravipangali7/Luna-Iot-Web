import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceOrderService } from '../../api/services/deviceOrderService';
import type { DeviceOrder, OrderStatusUpdate } from '../../types/deviceOrder';
import { useAuth } from '../../hooks/useAuth';
import { isSuperAdmin } from '../../utils/roleUtils';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Modal from '../../components/ui/common/Modal';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

const OrderIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<DeviceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeviceOrder | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<OrderStatusUpdate>({
    status: 'accepted',
    payment_status: undefined,
  });
  const [updating, setUpdating] = useState(false);

  const userIsSuperAdmin = user ? isSuperAdmin(user) : false;

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_previous: false,
  });

  const fetchOrders = async (page: number = 1, search: string = '', status: string = '', paymentStatus: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await deviceOrderService.getOrders(page, search, status || undefined, paymentStatus || undefined);

      if (response.success && response.data) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
        setCurrentPage(response.data.pagination.current_page);
      } else {
        setError(response.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, searchQuery, statusFilter, paymentStatusFilter);
  }, [currentPage, searchQuery, statusFilter, paymentStatusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    fetchOrders(currentPage, searchQuery, statusFilter, paymentStatusFilter);
  };

  const handleEditStatus = (order: DeviceOrder) => {
    setSelectedOrder(order);
    setStatusUpdate({
      status: order.status,
      payment_status: order.payment_status,
    });
    setShowStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setStatusUpdate({
      status: 'accepted',
      payment_status: undefined,
    });
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      setError(null);

      const updateData: OrderStatusUpdate = {
        status: statusUpdate.status,
      };

      if (statusUpdate.payment_status) {
        updateData.payment_status = statusUpdate.payment_status;
      }

      const response = await deviceOrderService.updateOrderStatus(
        selectedOrder.id,
        updateData
      );

      if (response.success && response.data) {
        showSuccess('Status Updated', 'Order status has been updated successfully');
        handleCloseStatusModal();
        fetchOrders(currentPage, searchQuery, statusFilter, paymentStatusFilter);
      } else {
        const errorMsg = response.error || 'Failed to update order status';
        setError(errorMsg);
        showError('Update Failed', errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred';
      setError(errorMsg);
      showError('Update Error', errorMsg);
      console.error('Error updating order status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'Rs 0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Rs 0.00';
    return `Rs ${numPrice.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'info' | 'warning' | 'success' } = {
      accepted: 'info',
      preparing: 'warning',
      dispatch: 'success',
    };
    return <Badge variant={variants[status] || 'info'} size="sm">{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: { [key: string]: 'warning' | 'danger' | 'success' } = {
      pending: 'warning',
      failed: 'danger',
      completed: 'success',
    };
    return <Badge variant={variants[status] || 'warning'} size="sm">{status}</Badge>;
  };

  if (loading && orders.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">Device Orders</h1>
            <p className="text-gray-600">View and track your device orders</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              icon={<RefreshIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/device-orders/catalog')}
            >
              New Order
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <form onSubmit={handleSearch} className="md:col-span-2 flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchInput}
                    onChange={(value) => setSearchInput(value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="primary">
                  Search
                </Button>
              </form>

              <Select
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'preparing', label: 'Preparing' },
                  { value: 'dispatch', label: 'Dispatch' },
                ]}
              />

              <Select
                value={paymentStatusFilter}
                onChange={(value) => {
                  setPaymentStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Payment Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Orders Table */}
        <Card>
          <CardBody>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="md" color="primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Order ID</TableHeader>
                      <TableHeader>User</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Payment Status</TableHeader>
                      <TableHeader>Items</TableHeader>
                      <TableHeader>Total</TableHeader>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">#{order.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.user_info?.name || 'N/A'}
                            <div className="text-gray-500">{order.user_info?.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(order.payment_status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.items_count || 0} items</span>
                          {order.total_quantity && (
                            <div className="text-xs text-gray-500">
                              {order.total_quantity} devices
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatPrice(order.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/device-orders/${order.id}`)}
                              icon={<VisibilityIcon className="w-4 h-4" />}
                            >
                              View
                            </Button>
                            {userIsSuperAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditStatus(order)}
                                icon={<EditIcon className="w-4 h-4" />}
                                title="Edit Status"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.current_page}
                      totalPages={pagination.total_pages}
                      onPageChange={handlePageChange}
                      hasNext={pagination.has_next}
                      hasPrevious={pagination.has_previous}
                      totalItems={pagination.total_items}
                      pageSize={10}
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* Status Update Modal */}
        <Modal
          isOpen={showStatusModal}
          onClose={handleCloseStatusModal}
          title="Update Order Status"
          size="md"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Order #{selectedOrder.id} - {selectedOrder.user_info?.name || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <Select
                  value={statusUpdate.status}
                  onChange={(value) => setStatusUpdate({ ...statusUpdate, status: value as 'accepted' | 'preparing' | 'dispatch' })}
                  options={[
                    { value: 'accepted', label: 'Accepted' },
                    { value: 'preparing', label: 'Preparing' },
                    { value: 'dispatch', label: 'Dispatch' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <Select
                  value={statusUpdate.payment_status || selectedOrder.payment_status}
                  onChange={(value) => setStatusUpdate({ ...statusUpdate, payment_status: value as 'pending' | 'failed' | 'completed' })}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'failed', label: 'Failed' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  loading={updating}
                  className="flex-1"
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseStatusModal}
                  disabled={updating}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Container>
  );
};

export default OrderIndexPage;

