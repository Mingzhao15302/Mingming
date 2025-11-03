import React from 'react';
import { useAppContext } from '../context/app-context.jsx';

export default function FloatingCartButton() {
  const { cart, navigate } = useAppContext();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (total === 0) return null;
  return (
    <button
      className="button-primary"
      style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50 }}
      onClick={() => navigate('#/cart')}
    >
      🛒 购物车 ({total})
    </button>
  );
}
