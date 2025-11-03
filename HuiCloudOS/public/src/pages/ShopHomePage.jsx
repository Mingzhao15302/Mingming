import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts } from '../utils/api.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { FloatingCartButton } from '../components/FloatingCartButton.jsx';
import { useCart, useToast } from '../hooks/useApp.js';

const PAGE_SIZE = 12;

const ShopHomePage = () => {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const sentinel = useRef(null);
  const cart = useCart();
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchProducts();
        setProducts(result.items);
        setHasMore(result.items.length >= PAGE_SIZE);
      } catch (error) {
        toast.push(error.message || '加载商品失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const filtered = useMemo(() => {
    const base = keyword
      ? products.filter((item) =>
          [item.name, item.model, item.tags?.join(' ')].filter(Boolean).some((text) => text.includes(keyword))
        )
      : products;
    return base.slice(0, page * PAGE_SIZE);
  }, [products, keyword, page]);

  useEffect(() => {
    if (!sentinel.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>商城精选</h2>
        <input className="input" placeholder="搜索产品名称或型号" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>
      <section className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onView={() => (window.location.hash = `#/product/${product.id}`)}
            onAdd={(item) => {
              cart.add(item);
              toast.push('已加入购物车');
            }}
          />
        ))}
      </section>
      <div ref={sentinel} style={{ height: '1px' }} />
      {loading && <div className="status-pill">加载中…</div>}
      <FloatingCartButton count={cart.items.reduce((sum, item) => sum + item.quantity, 0)} />
    </div>
  );
};

export default ShopHomePage;
