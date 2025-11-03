import React from 'react';

export const ProductCard = ({ product, onView, onAdd }) => {
  return (
    <article className="glass-card fade-in" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem' }}>
      <div
        style={{
          background: 'rgba(15,23,42,0.35)',
          borderRadius: '16px',
          aspectRatio: '4 / 3',
          display: 'grid',
          placeItems: 'center',
          color: 'white',
          fontSize: '1.1rem'
        }}
        onClick={() => onView?.(product)}
      >
        {product.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <strong>{product.name}</strong>
        <span style={{ color: 'rgba(15,23,42,0.65)' }}>{product.model}</span>
        <span style={{ color: '#0f172a', fontWeight: 700 }}>￥{product.price.toLocaleString()}</span>
      </div>
      <button className="button" onClick={(event) => { event.stopPropagation(); onAdd?.(product); }}>
        加入购物车
      </button>
    </article>
  );
};

export default ProductCard;
