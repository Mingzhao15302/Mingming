import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../app/store';
import { useCart } from '../components/shop/CartContext';

const Checkout: React.FC = () => {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: '',
    contact: '',
    salesperson: '',
    discount: 0,
  });
  const [loading, setLoading] = useState(false);
  const discountedTotal = useMemo(() => total * (1 - form.discount / 100), [total, form.discount]);
  const orderId = useMemo(() => `ORD-${Date.now()}`, []);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: key === 'discount' ? Number(value) : value }));
  };

  const persistOrder = async (status: string) => {
    if (!items.length) return;
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        id: orderId,
        customerName: form.customerName,
        contact: form.contact,
        salesperson: form.salesperson,
        items: items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
        total: discountedTotal,
        status,
      }),
    });
  };

  const handleSubmit = async () => {
    if (!items.length) return;
    setLoading(true);
    await persistOrder('submitted');
    setLoading(false);
    clear();
    navigate('/success', { replace: true });
  };

  const handleGenerateQuote = async () => {
    if (!items.length) return;
    await persistOrder('draft');
    await apiFetch(`/orders/${orderId}/quote`, { method: 'POST' });
    alert('报价单已生成，可在导出模块中查看。');
  };

  const handleGenerateContract = async () => {
    if (!items.length) return;
    await persistOrder('draft');
    await apiFetch('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        id: `contract-${orderId}`,
        title: `合同模板 - ${orderId}`,
        body: {
          customer: form.customerName,
          salesperson: form.salesperson,
          lines: items.map((item) => ({ description: item.name, quantity: item.quantity, unitPrice: item.price })),
        },
      }),
    });
    alert('合同模板已保存，可在控制台导出。');
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-card space-y-4 p-8">
        <h2 className="text-2xl font-semibold text-white">客户信息</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-white/70">
            客户名称
            <input
              className="glass-input mt-2 w-full"
              value={form.customerName}
              onChange={(event) => updateField('customerName', event.target.value)}
              placeholder="如：江苏辉信化工"
            />
          </label>
          <label className="text-sm text-white/70">
            联系方式
            <input
              className="glass-input mt-2 w-full"
              value={form.contact}
              onChange={(event) => updateField('contact', event.target.value)}
              placeholder="手机 / 邮箱"
            />
          </label>
          <label className="text-sm text-white/70">
            业务员
            <input
              className="glass-input mt-2 w-full"
              value={form.salesperson}
              onChange={(event) => updateField('salesperson', event.target.value)}
              placeholder="业务员姓名"
            />
          </label>
          <label className="text-sm text-white/70">
            优惠折扣（%）
            <input
              type="number"
              min={0}
              max={50}
              className="glass-input mt-2 w-full"
              value={form.discount}
              onChange={(event) => updateField('discount', event.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="glass-card space-y-4 p-8">
        <h2 className="text-2xl font-semibold text-white">订单汇总</h2>
        <ul className="space-y-3 text-white/80">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>¥{(item.price * item.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 pt-4 text-white">
          <p>原价合计：¥{total.toLocaleString()}</p>
          <p>优惠后金额：¥{discountedTotal.toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button type="button" className="glass-button" onClick={handleGenerateQuote}>
            生成报价单 PDF
          </button>
          <button type="button" className="glass-button" onClick={handleGenerateContract}>
            生成合同 PDF
          </button>
          <button type="button" className="glass-button" onClick={handleSubmit} disabled={loading || !items.length}>
            {loading ? '提交中...' : '提交订单'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
