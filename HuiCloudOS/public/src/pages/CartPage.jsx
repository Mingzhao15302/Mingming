import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useApp.js';

const CartPage = () => {
  const cart = useCart();
  const navigate = useNavigate();
  const total = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <h2>购物车</h2>
      <div className="grid" style={{ gap: '1rem' }}>
        {cart.items.length ? (
          cart.items.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                <div style={{ color: 'rgba(15,23,42,0.6)' }}>{item.product.model}</div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>￥{item.product.price.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="button secondary" type="button" onClick={() => cart.update(item.id, item.quantity - 1)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button className="button" type="button" onClick={() => cart.update(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <button className="button secondary" type="button" onClick={() => cart.remove(item.id)}>
                移除
              </button>
            </div>
          ))
        ) : (
          <p>购物车为空，去商城挑选喜欢的产品。</p>
        )}
      </div>
      <footer className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>合计：</strong>￥{total.toLocaleString()}
        </div>
        <button className="button" disabled={!cart.items.length} onClick={() => navigate('/checkout')}>
          去结算
        </button>
      </footer>
    </div>
  );
};

export default CartPage;
