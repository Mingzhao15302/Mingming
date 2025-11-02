import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

const PAGE_SIZE = 12;

export default function ShopHomePage() {
  const { api, setProducts, setCart, cart } = useAppContext();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const navigate = useNavigate();

  const load = async (targetPage) => {
    setLoading(true);
    const result = await api.get(`/api/products?page=${targetPage}&pageSize=${PAGE_SIZE}`);
    if (targetPage === 1) {
      setItems(result.items);
    } else {
      setItems((prev) => [...prev, ...result.items]);
    }
    setHasMore(result.items.length === PAGE_SIZE);
    setPage(result.page);
    setProducts(result.items);
    setLoading(false);
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          load(page + 1);
        }
      });
    }, { rootMargin: '200px' });
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [hasMore, loading, page]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 className="section-title">商城首页</h2>
        <p className="section-subtitle">液态玻璃风格的产品目录，支持懒加载与购物车操作。</p>
      </header>
      <div className="grid-responsive">
        {items.map((product) => (
          <article key={product.id} className="hc-card" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
            <div style={{ height: '180px', borderRadius: 'var(--hc-radius-md)', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>🛠️</span>
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <strong>{product.name}</strong>
              <span style={{ opacity: 0.75 }}>{product.description || '暂无描述'}</span>
              <span style={{ fontWeight: 700 }}>¥ {product.price}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button type="button" onClick={(event) => { event.stopPropagation(); addToCart(product); }}>
                加入购物车
              </button>
              <button type="button" onClick={() => navigate(`/product/${product.id}`)}>
                查看详情
              </button>
            </div>
          </article>
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: '1px' }} />
      {loading && <div style={{ textAlign: 'center', opacity: 0.75 }}>加载中...</div>}
      {!hasMore && !loading && <div style={{ textAlign: 'center', opacity: 0.65 }}>没有更多商品</div>}
      {cart.length > 0 && <div className="hc-card" style={{ padding: '1rem' }}>购物车共有 {cart.reduce((acc, item) => acc + item.quantity, 0)} 件商品</div>}
    </section>
  );
}
