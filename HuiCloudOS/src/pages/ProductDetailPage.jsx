import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/app-context.jsx';
import { fetchJSON } from '../utils/http.js';

export default function ProductDetailPage({ params }) {
  const { cart, setCart, navigate } = useAppContext();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!params.id) return;
    fetchJSON(`/api/products/${params.id}`).then(setProduct);
  }, [params.id]);

  const gallery = useMemo(() => product?.images || [], [product]);

  if (!product) {
    return <div className="glass-card" style={{ padding: '2rem' }}>正在加载产品信息...</div>;
  }

  const handleAdd = () => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-card" style={{ aspectRatio: '16 / 10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem' }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {gallery.map((image) => (
            <div key={image} className="glass-card" style={{ width: '96px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {image}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{product.name}</h2>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>{product.model}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <strong>技术参数</strong>
          {(product.specs || []).map((spec) => (
            <div key={spec} style={{ color: 'var(--text-secondary)' }}>
              {spec}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <strong style={{ fontSize: '1.6rem', color: '#2563eb' }}>￥{product.price.toLocaleString()}</strong>
          <button className="button-primary" onClick={handleAdd}>
            加入购物车
          </button>
          <button className="button-ghost" onClick={() => navigate('#/cart')}>
            查看购物车
          </button>
        </div>
      </div>
    </div>
  );
}
