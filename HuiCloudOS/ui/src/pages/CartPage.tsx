import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function CartPage() {
  const { cart, updateCartItem, removeFromCart } = useApp();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <h2 style={{ margin: 0 }}>购物车</h2>
      {cart.length === 0 ? (
        <p style={{ color: 'rgba(15,23,42,0.6)' }}>购物车为空，前往商城添加商品。</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>商品</th>
              <th>单价</th>
              <th>数量</th>
              <th>小计</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>¥{item.price}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button className="btn secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button className="btn secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => updateCartItem(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </td>
                <td>¥{(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button className="btn secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => removeFromCart(item.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="glass-soft" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'rgba(15,23,42,0.6)' }}>合计</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>¥{total.toFixed(2)}</div>
        </div>
        <Link to="/checkout" className="btn">
          去结算
        </Link>
      </div>
    </section>
  );
}
