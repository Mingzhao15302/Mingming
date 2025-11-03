import { FormEvent, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { api } from '../../app/api';

export function ProductModuleTab() {
  const { products, refreshProducts } = useApp();
  const [form, setForm] = useState({ name: '', price: 0, category: '', description: '' });

  function updateField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.createProduct({ ...form, specs: [], gallery: [] });
    await refreshProducts();
    setForm({ name: '', price: 0, category: '', description: '' });
  }

  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>新增商品</h3>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>名称</span>
          <input className="input" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>类别</span>
          <input className="input" value={form.category} onChange={(event) => updateField('category', event.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>价格</span>
          <input
            type="number"
            className="input"
            value={form.price}
            onChange={(event) => updateField('price', Number(event.target.value))}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          <span style={{ fontWeight: 600 }}>描述</span>
          <textarea
            className="textarea"
            rows={4}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </label>
        <button className="btn" type="submit">
          保存商品
        </button>
      </form>
      <section>
        <h3 style={{ marginTop: 0 }}>商品目录</h3>
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类别</th>
              <th>价格</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>¥{product.price}</td>
                <td>{product.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
