import { FormEvent, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { api } from '../../app/api';

export function QuoteModuleTab() {
  const { quotes, refreshQuotes } = useApp();
  const [form, setForm] = useState({
    template: '标准模板',
    customer: '',
    discount: 0,
    items: [{ name: '灌装机', price: 10000, quantity: 1 }],
  });

  function updateField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.createQuote({
      template: form.template,
      customer: { name: form.customer },
      discount: form.discount,
      items: form.items,
      total: form.items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0) * (1 - form.discount / 100),
    });
    await refreshQuotes();
  }

  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>新建报价单</h3>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>模板</span>
          <select className="select" value={form.template} onChange={(event) => updateField('template', event.target.value)}>
            <option value="标准模板">标准模板</option>
            <option value="大型项目模板">大型项目模板</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>客户名称</span>
          <input className="input" value={form.customer} onChange={(event) => updateField('customer', event.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>优惠折扣 %</span>
          <input
            type="number"
            className="input"
            value={form.discount}
            onChange={(event) => updateField('discount', Number(event.target.value))}
          />
        </label>
        <button className="btn" type="submit">
          保存报价
        </button>
      </form>
      <section>
        <h3 style={{ marginTop: 0 }}>报价记录</h3>
        <table className="table">
          <thead>
            <tr>
              <th>编号</th>
              <th>客户</th>
              <th>模板</th>
              <th>折扣</th>
              <th>总额</th>
              <th>日期</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td>{quote.id}</td>
                <td>{quote.customer?.name ?? '-'}</td>
                <td>{quote.template}</td>
                <td>{quote.discount}%</td>
                <td>¥{quote.total}</td>
                <td>{new Date(quote.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
