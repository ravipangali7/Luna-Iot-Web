import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceOrderService } from '../../api/services/deviceOrderService';
import type { DeviceOrder, OrderStatusUpdate } from '../../types/deviceOrder';
import { useAuth } from '../../hooks/useAuth';
import { isSuperAdmin } from '../../utils/roleUtils';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Button from '../../components/ui/buttons/Button';
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
import EditIcon from '@mui/icons-material/Edit';

const OrderShowPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<DeviceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<OrderStatusUpdate>({
    status: 'accepted',
    payment_status: undefined,
  });
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const userIsSuperAdmin = user ? isSuperAdmin(user) : false;

  const fetchOrder = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await deviceOrderService.getOrder(parseInt(id));

      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError(response.error || 'Failed to fetch order');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order) {
      setStatusUpdate({
        status: order.status,
        payment_status: order.payment_status,
      });
    }
  }, [order]);

  const handleStatusUpdate = async () => {
    if (!order || !id) return;

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
        parseInt(id),
        updateData
      );

      if (response.success && response.data) {
        setOrder(response.data);
        setShowStatusUpdate(false);
        showSuccess('Status Updated', 'Order status has been updated successfully');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'info' | 'warning' | 'success' } = {
      accepted: 'info',
      preparing: 'warning',
      dispatch: 'success',
    };
    return <Badge variant={variants[status] || 'info'} size="md">{status.toUpperCase()}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: { [key: string]: 'warning' | 'danger' | 'success' } = {
      pending: 'warning',
      failed: 'danger',
      completed: 'success',
    };
    return <Badge variant={variants[status] || 'warning'} size="md">{status.toUpperCase()}</Badge>;
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

  if (!order) {
    return (
      <Container>
        <Alert variant="danger">
          Order not found
        </Alert>
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
              onClick={() => navigate('/device-orders')}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-600">Order details and tracking</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
              </CardHeader>
              <CardBody>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Product</TableHeader>
                      <TableHeader>Price</TableHeader>
                      <TableHeader>Quantity</TableHeader>
                      <TableHeader>Total</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {item.subscription_plan.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatPrice(item.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{item.quantity}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(item.total)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-600">Order Status</label>
                      {userIsSuperAdmin && !showStatusUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStatusUpdate(true)}
                          icon={<EditIcon className="w-3 h-3" />}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="mt-1">
                      {showStatusUpdate && userIsSuperAdmin ? (
                        <Select
                          value={statusUpdate.status}
                          onChange={(value) => setStatusUpdate({ ...statusUpdate, status: value as 'accepted' | 'preparing' | 'dispatch' })}
                          options={[
                            { value: 'accepted', label: 'Accepted' },
                            { value: 'preparing', label: 'Preparing' },
                            { value: 'dispatch', label: 'Dispatch' },
                          ]}
                          size="sm"
                        />
                      ) : (
                        getStatusBadge(order.status)
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-600">Payment Status</label>
                    </div>
                    <div className="mt-1">
                      {showStatusUpdate && userIsSuperAdmin ? (
                        <Select
                          value={statusUpdate.payment_status || order.payment_status}
                          onChange={(value) => setStatusUpdate({ ...statusUpdate, payment_status: value as 'pending' | 'failed' | 'completed' })}
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'failed', label: 'Failed' },
                            { value: 'completed', label: 'Completed' },
                          ]}
                          size="sm"
                        />
                      ) : (
                        getPaymentStatusBadge(order.payment_status)
                      )}
                    </div>
                  </div>

                  {showStatusUpdate && userIsSuperAdmin && (
                    <div className="border-t pt-4 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        loading={updating}
                      >
                        Update Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowStatusUpdate(false);
                          if (order) {
                            setStatusUpdate({
                              status: order.status,
                              payment_status: order.payment_status,
                            });
                          }
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatPrice(order.sub_total)}</span>
                    </div>

                    {order.is_vat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT (13%):</span>
                        <span className="font-medium">{formatPrice(order.vat)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Ordered by:</span>
                      <div className="mt-1">
                        {order.user_info?.name || 'N/A'}
                        <div className="text-xs">{order.user_info?.phone}</div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Order Date:</span>
                      <div className="mt-1">{formatDate(order.created_at)}</div>
                    </div>
                    {order.updated_at !== order.created_at && (
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <div className="mt-1">{formatDate(order.updated_at)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default OrderShowPage;

