import React, { useMemo } from 'react';
import { useAppContext } from '../context/app-context.jsx';
import CartItem from '../components/CartItem.jsx';
import CartSummary from '../components/CartSummary.jsx';

export default function CartPage() {
  const { cart, setCart, navigate } = useAppContext();
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ margin: 0 }}>购物车</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cart.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onIncrease={() => updateQuantity(item.id, 1)}
            onDecrease={() => updateQuantity(item.id, -1)}
            onRemove={() => setCart((prev) => prev.filter((row) => row.id !== item.id))}
          />
        ))}
        {cart.length === 0 && <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>购物车为空</div>}
      </div>
      {cart.length > 0 && <CartSummary subtotal={subtotal} onCheckout={() => navigate('#/checkout')} />}
    </div>
  );
}
