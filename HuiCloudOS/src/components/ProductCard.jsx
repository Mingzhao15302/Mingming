import React from 'react';
import { useAppContext } from '../context/app-context.jsx';

export default function ProductCard({ product }) {
  const { navigate, cart, setCart } = useAppContext();

  const handleAdd = (event) => {
    event.stopPropagation();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  return (
    <article
      className="glass-card"
      onClick={() => navigate(`#/product?id=${product.id}`)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: '18px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 10',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.3))',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          color: '#1d4ed8'
        }}
      >
        {product.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h3 style={{ margin: 0 }}>{product.name}</h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{product.model}</span>
        <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>￥{product.price.toLocaleString()}</strong>
      </div>
      <button className="button-primary" onClick={handleAdd}>
        加入购物车
      </button>
    </article>
  );
}
