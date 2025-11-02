import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';
import { clearCart, getCart } from '../app/cart';

interface FormState {
  customerName: string;
  contact: string;
  phone: string;
  salesperson: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ customerName: '', contact: '', phone: '', salesperson: '' });
  const items = useMemo(() => getCart(), []);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const orderNo = `HX${Date.now()}`;
    await axios.post('/api/orders', {
      orderNo,
      customerName: form.customerName,
      contact: form.contact,
      phone: form.phone,
      salesperson: form.salesperson,
      items,
      total
    });
    clearCart();
    navigate('/success');
  };

  const handleQuotePdf = async () => {
    try {
      await axios.post('/api/quotes/default/export', {
        title: '自动生成报价单',
        customer: form.customerName,
        salesperson: form.salesperson,
        items,
        total
      });
      alert('报价单生成成功，已保存在服务器 exports/quotes 目录中');
    } catch (error) {
      alert('生成报价单失败，请检查模板配置');
      console.error(error);
    }
  };

  const handleContractPdf = async () => {
    try {
      await axios.post('/api/orders/HX-CONTRACT/export/pdf', {
        items,
        total
      });
      alert('合同 PDF 生成任务已触发');
    } catch (error) {
      alert('生成合同 PDF 失败，请稍后再试');
      console.error(error);
    }
  };

  return (
    <AppShell>
      <form className="space-y-10" onSubmit={submitOrder}>
        <section className="grid gap-6 rounded-3xl bg-white/10 p-8 shadow-lg md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">客户信息</h3>
            <Field label="客户名称" value={form.customerName} onChange={(value) => updateField('customerName', value)} />
            <Field label="联系人" value={form.contact} onChange={(value) => updateField('contact', value)} />
            <Field label="联系电话" value={form.phone} onChange={(value) => updateField('phone', value)} />
            <Field label="业务员" value={form.salesperson} onChange={(value) => updateField('salesperson', value)} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">订单汇总</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-200">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>¥{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="text-right text-lg text-white">
              合计：<span className="text-2xl font-bold text-sky-200">¥{total.toFixed(2)}</span>
            </div>
          </div>
        </section>
        <div className="flex flex-wrap justify-end gap-4">
          <Button type="button" onClick={handleQuotePdf} className="bg-white/20 px-6 py-3 text-base text-white hover:bg-white/40">
            生成报价单 PDF
          </Button>
          <Button type="button" onClick={handleContractPdf} className="bg-white/20 px-6 py-3 text-base text-white hover:bg-white/40">
            生成合同 PDF
          </Button>
          <Button type="submit" className="px-6 py-3 text-base">
            提交订单
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-slate-200">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </label>
  );
}
