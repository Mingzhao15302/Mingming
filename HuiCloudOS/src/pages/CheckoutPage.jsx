import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/app-context.jsx';

export default function CheckoutPage() {
  const { cart, setCart, navigate } = useAppContext();
  const [form, setForm] = useState({ company: '', contact: '', phone: '', salesperson: '' });
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, items: cart, total })
    });
    setCart([]);
    navigate('#/success');
  };

  return (
    <form className="glass-card" onSubmit={handleSubmit} style={{ padding: '2rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>客户信息</h2>
        {[
          { key: 'company', label: '客户名称' },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系电话' },
          { key: 'salesperson', label: '业务员信息' }
        ].map((field) => (
          <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>{field.label}</span>
            <input
              required
              value={form[field.key]}
              onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
            />
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>订单汇总</h2>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>￥{(item.price * item.quantity).toLocaleString()}</strong>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>
            <span>合计</span>
            <span>￥{total.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="button-ghost" onClick={() => window.print()}>
            生成报价 PDF
          </button>
          <button type="button" className="button-ghost" onClick={() => window.print()}>
            生成合同 PDF
          </button>
          <button className="button-primary" type="submit">
            提交订单
          </button>
        </div>
      </div>
    </form>
  );
}
