import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FloatingCartButton({ count }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="hc-floating-cart"
      onClick={() => navigate('/cart')}
      style={{ display: count > 0 ? 'inline-flex' : 'none', alignItems: 'center', gap: '0.5rem' }}
    >
      🛒 <span>{count} 件</span>
    </button>
  );
}
