import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

export default function CartPage() {
  const { cart, setCart } = useAppContext();
  const navigate = useNavigate();

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + Number(item.price || 0) * item.quantity, 0);

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 className="section-title">购物车</h2>
        <p className="section-subtitle">调整数量并继续结算</p>
      </header>
      <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        {cart.map((item) => (
          <div key={item.id} className="hc-card" style={{ padding: '1rem', display: 'grid', gap: '0.5rem', alignItems: 'center', gridTemplateColumns: '1fr auto auto' }}>
            <div>
              <strong>{item.name}</strong>
              <div style={{ opacity: 0.7 }}>¥ {item.price}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                -
              </button>
              <span>{item.quantity}</span>
              <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                +
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => removeItem(item.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
        {cart.length === 0 && <span style={{ opacity: 0.6 }}>购物车为空</span>}
      </div>
      <footer className="hc-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>合计：¥ {total.toFixed(2)}</span>
        <button type="button" onClick={() => navigate('/checkout')} disabled={cart.length === 0}>
          去结算
        </button>
      </footer>
    </section>
  );
}
