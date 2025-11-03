import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function ProductDetailPage() {
  const { id } = useParams();
  const { products, addToCart } = useApp();
  const product = useMemo(() => products.find((item) => item.id === id), [products, id]);

  if (!product) {
    return <div className="glass" style={{ padding: '2rem' }}>未找到该产品，请返回商城。</div>;
  }

  return (
    <section className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem' }}>{product.name}</h2>
          <div className="tag">{product.category || '未分类'}</div>
        </div>
        <button className="btn" onClick={() => addToCart(product, 1)}>
          加入购物车
        </button>
      </header>
      <div className="glass-soft" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>产品介绍</h3>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{product.description || '暂无介绍内容。'}</p>
      </div>
      <div className="glass-soft" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>技术参数</h3>
        <ul style={{ display: 'grid', gap: '0.6rem' }}>
          {product.specs?.map((spec) => (
            <li key={spec.label} className="glass-inline" style={{ padding: '0.75rem 1rem' }}>
              <strong>{spec.label}：</strong>
              <span>{spec.value}</span>
            </li>
          ))}
          {(!product.specs || product.specs.length === 0) && <li style={{ color: 'rgba(15,23,42,0.6)' }}>暂无参数信息。</li>}
        </ul>
      </div>
    </section>
  );
}
