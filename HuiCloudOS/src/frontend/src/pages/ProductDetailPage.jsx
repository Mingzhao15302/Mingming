import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { api, setCart } = useAppContext();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api.get(`/api/products/${id}`).then((result) => setProduct(result.item));
  }, [api, id]);

  if (!product) {
    return <div className="hc-card" style={{ padding: '2rem' }}>加载中...</div>;
  }

  const addToCart = () => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  return (
    <section className="hc-card" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <header>
        <h2 className="section-title">{product.name}</h2>
        <p className="section-subtitle">型号：{product.id}</p>
      </header>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="hc-card" style={{ padding: '1rem', minHeight: '240px', display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
            {product.gallery?.length ? (
              product.gallery.map((image, index) => (
                <div key={index} style={{ minWidth: '200px', height: '160px', borderRadius: 'var(--hc-radius-md)', background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                  <span>{image}</span>
                </div>
              ))
            ) : (
              <div style={{ width: '100%', height: '160px', borderRadius: 'var(--hc-radius-md)', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🖼️</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div className="hc-card" style={{ padding: '1rem', display: 'grid', gap: '0.5rem' }}>
            <strong>技术参数</strong>
            <p style={{ margin: 0, opacity: 0.75 }}>{product.specs || '敬请期待'}</p>
          </div>
          <div className="hc-card" style={{ padding: '1rem', display: 'grid', gap: '0.5rem' }}>
            <strong>价格</strong>
            <span style={{ fontSize: '1.6rem', fontWeight: 700 }}>¥ {product.price}</span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={addToCart}>
                加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
