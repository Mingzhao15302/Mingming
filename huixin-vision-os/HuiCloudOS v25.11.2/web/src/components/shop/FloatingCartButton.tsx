import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';

const FloatingCartButton: React.FC = () => {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      to="/cart"
      className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-white shadow-2xl shadow-cyan-500/50 transition hover:shadow-glow"
    >
      <ShoppingBag size={20} />
      购物车
      {count > 0 && <span className="rounded-full bg-white/20 px-2 text-sm">{count}</span>}
    </Link>
  );
};

export default FloatingCartButton;
