import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceOrderService } from '../../api/services/deviceOrderService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { SubscriptionPlanBasic, Cart } from '../../types/deviceOrder';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

const ProductCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SubscriptionPlanBasic[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await deviceOrderService.getSubscriptionPlansForOrder();

      if (response.success && response.data) {
        setProducts(response.data);
        // Initialize quantities
        const initialQuantities: { [key: number]: number } = {};
        response.data.forEach((product) => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
      } else {
        setError(response.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await deviceOrderService.getCart();
      if (response.success && response.data) {
        setCart(response.data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const handleAddToCart = async (productId: number) => {
    const quantity = quantities[productId] || 1;
    
    if (quantity <= 0) {
      showError('Quantity must be greater than 0');
      return;
    }

    try {
      const response = await deviceOrderService.addToCart(productId, quantity);
      
      if (response.success) {
        showSuccess('Item added to cart');
        // Wait a bit for session to save, then refresh cart
        setTimeout(() => {
          fetchCart();
        }, 100);
      } else {
        showError(response.error || 'Failed to add to cart');
      }
    } catch (err) {
      showError('An unexpected error occurred');
      console.error('Error adding to cart:', err);
    }
  };

  const handleQuantityChange = (productId: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, numValue)
    }));
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return `Rs ${numPrice.toFixed(2)}`;
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Device Catalog</h1>
            <p className="text-gray-600">Browse and order devices (subscription plans)</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchProducts();
                fetchCart();
              }}
              icon={<RefreshIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/device-orders/cart')}
              icon={<ShoppingCartIcon className="w-4 h-4" />}
            >
              View Cart {cart && cart.item_count > 0 && `(${cart.item_count})`}
            </Button>
          </div>
        </div>

        {/* Cart Summary */}
        {cart && cart.item_count > 0 && (
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{cart.item_count}</span> item(s) in cart
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Quantity: <span className="font-semibold">{cart.total_quantity}</span> devices
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(cart.subtotal)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardBody>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <p className="text-gray-500">No products found</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Regular Price:</span>
                        <span className="text-sm font-medium">{formatPrice(product.price)}</span>
                      </div>
                      {product.dealer_price && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Dealer Price:</span>
                          <span className="text-sm font-medium text-blue-600">
                            {formatPrice(product.dealer_price)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-900">Purchasing Price:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(product.purchasing_price)}
                        </span>
                      </div>
                    </div>

                    {product.purchasing_price ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <label className="text-sm text-gray-700">Quantity:</label>
                          <Input
                            type="number"
                            min="1"
                            value={quantities[product.id]?.toString() || '1'}
                            onChange={(value) => handleQuantityChange(product.id, value)}
                            className="w-20"
                          />
                        </div>
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => handleAddToCart(product.id)}
                          icon={<AddShoppingCartIcon className="w-4 h-4" />}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Not available for ordering
                      </Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ProductCatalogPage;

