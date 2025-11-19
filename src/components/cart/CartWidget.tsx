import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceOrderService } from '../../api/services/deviceOrderService';
import type { Cart } from '../../types/deviceOrder';
import Button from '../ui/buttons/Button';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Badge from '../ui/common/Badge';

const CartWidget: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);

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
    fetchCart();
    // Refresh cart every 30 seconds
    const interval = setInterval(fetchCart, 30000);
    return () => clearInterval(interval);
  }, []);

  const itemCount = cart?.item_count || 0;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/device-orders/cart')}
      className="relative"
    >
      <ShoppingCartIcon className="w-5 h-5" />
      {itemCount > 0 && (
        <Badge
          variant="danger"
          size="sm"
          className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  );
};

export default CartWidget;

