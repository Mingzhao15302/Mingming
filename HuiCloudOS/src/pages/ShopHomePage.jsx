import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import FloatingCartButton from '../components/FloatingCartButton.jsx';
import { fetchJSON } from '../utils/http.js';

export default function ShopHomePage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await fetchJSON(`/api/products?page=${page}`);
      setProducts((prev) => (page === 1 ? result.items : [...prev, ...result.items]));
      setTotal(result.total);
      setLoading(false);
    };
    load();
  }, [page]);

  const hasMore = page * 12 < total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="glass-card" style={{ padding: '1rem' }}>
        <input
          placeholder="搜索产品型号或名称"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.4)'
          }}
        />
      </section>
      <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
      {loading && <div className="glass-card" style={{ padding: '1rem' }}>加载中...</div>}
      {hasMore && !loading && (
        <button className="button-ghost" onClick={() => setPage((prev) => prev + 1)}>
          加载更多
        </button>
      )}
      <FloatingCartButton />
    </div>
  );
}
