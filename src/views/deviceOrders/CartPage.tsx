import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceOrderService } from '../../api/services/deviceOrderService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { Cart } from '../../types/deviceOrder';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
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
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await deviceOrderService.getCart();

      if (response.success && response.data) {
        setCart(response.data);
        // Initialize quantities from cart using item IDs
        const initialQuantities: { [key: number]: number } = {};
        response.data.items.forEach((item) => {
          if (item.id) {
            initialQuantities[item.id] = item.quantity;
          }
        });
        setQuantities(initialQuantities);
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
  }, []);

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, numValue)
    }));
  };

  const handleUpdateQuantity = async (itemId: number) => {
    const quantity = quantities[itemId];
    
    if (quantity <= 0) {
      showError('Quantity must be greater than 0');
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }));
      const response = await deviceOrderService.updateCartItem(itemId, quantity);

      if (response.success) {
        showSuccess('Cart updated');
        setTimeout(() => {
          fetchCart();
        }, 100);
      } else {
        showError(response.error || 'Failed to update cart');
      }
    } catch (err) {
      showError('An unexpected error occurred');
      console.error('Error updating cart:', err);
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }));
      const response = await deviceOrderService.removeFromCart(itemId);

      if (response.success) {
        showSuccess('Item removed from cart');
        setTimeout(() => {
          fetchCart();
        }, 100);
      } else {
        showError(response.error || 'Failed to remove item');
      }
    } catch (err) {
      showError('An unexpected error occurred');
      console.error('Error removing item:', err);
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear the entire cart?')) {
      return;
    }

    try {
      const response = await deviceOrderService.clearCart();

      if (response.success) {
        showSuccess('Cart cleared');
        setTimeout(() => {
          fetchCart();
        }, 100);
      } else {
        showError(response.error || 'Failed to clear cart');
      }
    } catch (err) {
      showError('An unexpected error occurred');
      console.error('Error clearing cart:', err);
    }
  };

  const handleProceedToCheckout = () => {
    if (!cart || cart.total_quantity < 50) {
      showError(`Minimum order quantity is 50 devices. Current total: ${cart?.total_quantity || 0}`);
      return;
    }
    navigate('/device-orders/checkout');
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'Rs 0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Rs 0.00';
    return `Rs ${numPrice.toFixed(2)}`;
  };

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

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/device-orders/catalog')}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">Review and manage your cart items</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Empty Cart */}
        {cart && cart.items.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <ShoppingCartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">Your cart is empty</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/device-orders/catalog')}
                >
                  Browse Products
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Cart Items</h3>
                  {cart && cart.items.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearCart}
                    >
                      Clear Cart
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Product</TableHeader>
                      <TableHeader>Price</TableHeader>
                      <TableHeader>Quantity</TableHeader>
                      <TableHeader>Total</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart?.items.map((item) => (
                      <TableRow key={item.id || item.subscription_plan_id}>
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
                          <div className="flex gap-2 items-center">
                            <Input
                              type="number"
                              min="1"
                              value={quantities[item.id || 0]?.toString() || item.quantity.toString()}
                              onChange={(value) => handleQuantityChange(item.id || 0, value)}
                              className="w-20"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id || 0)}
                              disabled={updating[item.id || 0]}
                            >
                              Update
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(item.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id || 0)}
                            disabled={updating[item.id || 0]}
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            {/* Cart Summary */}
            {cart && cart.items.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{cart.item_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-medium">
                        {cart.total_quantity} devices
                        {!isMinimumQuantityMet && (
                          <Badge variant="danger" size="sm" className="ml-2">
                            Min: 50
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(cart.subtotal)}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      {!isMinimumQuantityMet && (
                        <Alert variant="warning" className="mb-4">
                          Minimum order quantity is 50 devices. Please add more items to your cart.
                        </Alert>
                      )}
                      <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={handleProceedToCheckout}
                        disabled={!isMinimumQuantityMet}
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </Container>
  );
};

export default CartPage;

