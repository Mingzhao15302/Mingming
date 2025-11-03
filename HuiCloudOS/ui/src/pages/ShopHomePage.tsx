import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function ShopHomePage() {
  const { products, addToCart } = useApp();
  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem' }}>商城精选</h2>
          <p style={{ margin: 0, color: 'rgba(15,23,42,0.6)' }}>查看最新灌装装备解决方案，支持快速下单。</p>
        </div>
        <Link to="/cart" className="btn secondary">
          查看购物车
        </Link>
      </div>
      <div className="grid-responsive">
        {products.map((product) => (
          <div key={product.id} className="glass" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.75rem' }}>{product.name}</h3>
              <p style={{ margin: 0, color: 'rgba(15,23,42,0.6)' }}>{product.description || '暂无描述'}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="tag">{product.category || '未分类'}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>¥{product.price}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Link to={`/product/${product.id}`} className="btn secondary" style={{ padding: '0.6rem 1rem' }}>
                  查看详情
                </Link>
                <button className="btn" style={{ padding: '0.6rem 1rem' }} onClick={() => addToCart(product, 1)}>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>暂无商品，请在控制台添加。</div>}
      </div>
    </section>
  );
}
