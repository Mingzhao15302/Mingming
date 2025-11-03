import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOrder } from '../utils/api.js';
import { useCart, useToast } from '../hooks/useApp.js';

const initialCustomer = {
  company: '',
  contact: '',
  phone: '',
  salesperson: ''
};

const CheckoutPage = () => {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(initialCustomer);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  const total = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0), [cart.items]);
  const final = Math.max(0, total - discount);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitOrder({ customer, items: cart.items, total, discount, final });
      toast.push('订单提交成功');
      cart.clear();
      navigate('/success');
    } catch (error) {
      toast.push(error.message || '提交订单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <h2>结算</h2>
      <section className="glass-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>客户信息</h3>
        {Object.entries(customer).map(([key, value]) => (
          <label key={key} style={{ display: 'grid', gap: '0.35rem' }}>
            {key === 'company' && '客户名称'}
            {key === 'contact' && '联系人'}
            {key === 'phone' && '联系电话'}
            {key === 'salesperson' && '业务员'}
            <input className="input" value={value} onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })} />
          </label>
        ))}
      </section>
      <section className="order-summary">
        <h3 style={{ margin: 0 }}>订单汇总</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {cart.items.map((item) => (
            <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>￥{(item.product.price * item.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          优惠金额
          <input
            className="input"
            type="number"
            value={discount}
            min="0"
            max={total}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
        </label>
        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>应付：￥{final.toLocaleString()}</div>
      </section>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="button secondary" type="button" onClick={handlePrint}>
          生成报价单 PDF
        </button>
        <button className="button secondary" type="button" onClick={handlePrint}>
          生成合同 PDF
        </button>
        <button className="button" type="button" onClick={handleSubmit} disabled={!cart.items.length || loading}>
          {loading ? '提交中…' : '提交订单'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
