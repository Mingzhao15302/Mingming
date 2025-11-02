import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

export default function CheckoutPage() {
  const { cart, setCart, api } = useAppContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer: '',
    contact: '',
    phone: '',
    salesperson: '',
    discount: 0
  });

  const subtotal = cart.reduce((acc, item) => acc + Number(item.price || 0) * item.quantity, 0);
  const discountAmount = subtotal * (Number(form.discount) / 100);
  const total = subtotal - discountAmount;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const order = await api.post('/api/orders', {
      customer: form.customer,
      contact: form.contact,
      phone: form.phone,
      salesperson: form.salesperson,
      discount: Number(form.discount),
      subtotal,
      total,
      items: cart
    });
    setCart([]);
    navigate('/success', { state: { order } });
  };

  const printDocument = (title) => {
    const printable = window.open('', '_blank');
    printable.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:sans-serif;padding:2rem;}table{width:100%;border-collapse:collapse;margin-top:1rem;}td,th{border:1px solid #ccc;padding:0.5rem;}</style></head><body><h1>${title}</h1><p>客户：${form.customer}</p><p>联系人：${form.contact}</p><p>电话：${form.phone}</p><p>业务员：${form.salesperson}</p><table><thead><tr><th>产品</th><th>数量</th><th>单价</th><th>小计</th></tr></thead><tbody>${cart
      .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.price}</td><td>${(item.price * item.quantity).toFixed(2)}</td></tr>`)
      .join('')}</tbody></table><p>折扣：${form.discount}%</p><p>合计：¥ ${total.toFixed(2)}</p></body></html>`);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 className="section-title">结算信息</h2>
        <p className="section-subtitle">填写客户信息并生成报价或合同</p>
      </header>
      <form onSubmit={handleSubmit} className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <input placeholder="客户名称" value={form.customer} onChange={(event) => setForm((prev) => ({ ...prev, customer: event.target.value }))} />
          <input placeholder="联系人" value={form.contact} onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))} />
          <input placeholder="联系电话" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          <input placeholder="业务员" value={form.salesperson} onChange={(event) => setForm((prev) => ({ ...prev, salesperson: event.target.value }))} />
          <input type="number" placeholder="优惠 (%)" value={form.discount} onChange={(event) => setForm((prev) => ({ ...prev, discount: event.target.value }))} />
        </div>
        <div className="hc-card" style={{ padding: '1rem' }}>
          <strong>订单汇总</strong>
          <table className="hc-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>产品</th>
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
                  <td>{item.price}</td>
                  <td>{(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'grid', gap: '0.35rem', marginTop: '1rem' }}>
            <span>小计：¥ {subtotal.toFixed(2)}</span>
            <span>折扣：{form.discount}%</span>
            <strong>应付总额：¥ {total.toFixed(2)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => printDocument('报价单预览')}>
            生成报价单 PDF
          </button>
          <button type="button" onClick={() => printDocument('合同预览')}>
            生成合同 PDF
          </button>
          <button type="submit" disabled={cart.length === 0}>
            提交订单
          </button>
        </div>
      </form>
    </section>
  );
}
