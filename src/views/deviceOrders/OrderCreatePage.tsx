import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceOrderService } from '../../api/services/deviceOrderService';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { Cart } from '../../types/deviceOrder';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Button from '../../components/ui/buttons/Button';
import Checkbox from '../../components/ui/forms/Checkbox';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const OrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVat, setIsVat] = useState(false);
  const { wallet, formatBalance, refreshBalance } = useWalletBalance();

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await deviceOrderService.getCart();

      if (response.success && response.data) {
        setCart(response.data);
        
        // Validate minimum quantity
        if (response.data.total_quantity < 50) {
          setError(`Minimum order quantity is 50 devices. Current total: ${response.data.total_quantity}`);
        }
      } else {
        setError(response.error || 'Failed to fetch cart');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    refreshBalance();
  }, []);

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, vat: 0, total: 0 };
    
    const subtotal = cart.subtotal;
    const vat = isVat ? subtotal * 0.13 : 0;
    const total = subtotal + vat;
    
    return { subtotal, vat, total };
  };

  const handlePlaceOrder = async () => {
    if (!cart) {
      showError('Cart is empty');
      return;
    }

    if (cart.total_quantity < 50) {
      showError(`Minimum order quantity is 50 devices. Current total: ${cart.total_quantity}`);
      return;
    }

    const { total } = calculateTotals();
    const walletBalance = wallet?.balance || 0;

    if (walletBalance < total) {
      const totalNum = typeof total === 'string' ? parseFloat(total) : total;
      const balanceNum = typeof walletBalance === 'string' ? parseFloat(walletBalance) : walletBalance;
      showError(
        `Insufficient wallet balance. Required: Rs ${totalNum.toFixed(2)}, Available: Rs ${balanceNum.toFixed(2)}. Please top up your wallet.`
      );
      navigate('/wallet');
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);

      const response = await deviceOrderService.createOrder(isVat);

      if (response.success && response.data) {
        showSuccess('Order placed successfully!');
        refreshBalance();
        navigate(`/device-orders/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to place order');
        showError(response.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      showError('An unexpected error occurred');
      console.error('Error placing order:', err);
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'Rs 0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Rs 0.00';
    return `Rs ${numPrice.toFixed(2)}`;
  };

  const { subtotal, vat, total } = calculateTotals();
  const walletBalance = wallet?.balance || 0;
  const hasInsufficientBalance = walletBalance < total;
  const isMinimumQuantityMet = cart ? cart.total_quantity >= 50 : false;

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container>
        <Alert variant="warning">
          Your cart is empty. Please add items to your cart first.
        </Alert>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate('/device-orders/catalog')}>
            Browse Products
          </Button>
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
              onClick={() => navigate('/device-orders/cart')}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600">Review your order and complete payment</p>
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
          {/* Order Items */}
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
                    {cart.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {item.subscription_plan_title}
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
                  {/* Wallet Balance */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AccountBalanceWalletIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Wallet Balance</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatBalance(walletBalance)}
                    </div>
                    {hasInsufficientBalance && (
                      <Alert variant="danger" className="mt-2">
                        Insufficient balance
                      </Alert>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>

                    {/* VAT Toggle */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={isVat}
                          onChange={(checked) => setIsVat(checked)}
                        />
                        <span className="text-sm text-gray-700">Apply VAT (13%)</span>
                      </label>
                    </div>

                    {isVat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT (13%):</span>
                        <span className="font-medium">{formatPrice(vat)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  {/* Minimum Quantity Warning */}
                  {!isMinimumQuantityMet && (
                    <Alert variant="warning">
                      Minimum order quantity is 50 devices. Current: {cart.total_quantity}
                    </Alert>
                  )}

                  {/* Insufficient Balance Warning */}
                  {hasInsufficientBalance && (
                    <Alert variant="danger">
                      Insufficient wallet balance. Please top up your wallet.
                    </Alert>
                  )}

                  {/* Place Order Button */}
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={!isMinimumQuantityMet || hasInsufficientBalance || placingOrder}
                    loading={placingOrder}
                  >
                    {placingOrder ? 'Placing Order...' : 'Place Order'}
                  </Button>

                  {hasInsufficientBalance && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => navigate('/wallet')}
                    >
                      Top Up Wallet
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default OrderCreatePage;

