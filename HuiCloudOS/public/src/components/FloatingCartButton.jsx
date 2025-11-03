import React from 'react';
import { useNavigate } from 'react-router-dom';

export const FloatingCartButton = ({ count }) => {
  const navigate = useNavigate();
  return (
    <button
      className="button"
      style={{
        position: 'fixed',
        right: '1.5rem',
        bottom: '1.5rem',
        padding: '1rem 1.5rem',
        borderRadius: '28px',
        zIndex: 50
      }}
      onClick={() => navigate('/cart')}
    >
      🛒 购物车 {count}
    </button>
  );
};

export default FloatingCartButton;
