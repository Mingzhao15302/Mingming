import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { api } from '../app/api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useApp();
  const [form, setForm] = useState({
    customerName: '',
    contact: '',
    phone: '',
    agent: '',
  });
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!cart.length) return;
    await api.createOrder({
      customer: {
        name: form.customerName,
        contact: form.contact,
        phone: form.phone,
        agent: form.agent,
      },
      items: cart,
      total,
    });
    clearCart();
    navigate('/success');
  }

  function handlePrintQuote() {
    window.print();
  }

  if (!cart.length) {
    return <div className="glass" style={{ padding: '2rem' }}>购物车为空，请先添加商品。</div>;
  }

  return (
    <form className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }} onSubmit={handleSubmit}>
      <h2 style={{ margin: 0 }}>订单结算</h2>
      <section className="glass-soft" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>客户信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>客户名称</span>
            <input className="input" value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>联系人</span>
            <input className="input" value={form.contact} onChange={(event) => updateField('contact', event.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>联系电话</span>
            <input className="input" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span>业务员</span>
            <input className="input" value={form.agent} onChange={(event) => updateField('agent', event.target.value)} />
          </label>
        </div>
      </section>
      <section className="glass-soft" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>订单汇总</h3>
        <table className="table">
          <thead>
            <tr>
              <th>商品</th>
              <th>数量</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>¥{item.price}</td>
                <td>¥{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1.2rem', fontWeight: 700 }}>
          合计：¥{total.toFixed(2)}
        </div>
      </section>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn secondary" type="button" onClick={handlePrintQuote}>
          生成报价单 PDF
        </button>
        <button className="btn secondary" type="button" onClick={handlePrintQuote}>
          生成合同 PDF
        </button>
        <button className="btn" type="submit">
          提交订单
        </button>
      </div>
    </form>
  );
}
