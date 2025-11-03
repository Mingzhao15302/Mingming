import React, { useEffect, useMemo, useState } from 'react';
import TabBar from '../components/TabBar.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import { useAppContext } from '../context/app-context.jsx';
import { fetchJSON, uploadFormData } from '../utils/http.js';

const TABS = [
  { key: 'videos', label: '视频库' },
  { key: 'quotes', label: '报价模块' },
  { key: 'orders', label: '订单模块' },
  { key: 'products', label: '商品模块' },
  { key: 'contracts', label: '合同模板' },
  { key: 'export', label: '导出' },
  { key: 'settings', label: '设置' },
  { key: 'maintenance', label: '维护' }
];

const QUOTE_DISCOUNTS = [
  { label: '标准折扣', value: 0.95 },
  { label: '战略合作', value: 0.9 },
  { label: 'VIP 客户', value: 0.85 }
];

export default function ConsolePage() {
  const { user, videos, refreshVideos, videoMeta } = useAppContext();
  const [active, setActive] = useState('videos');
  const [uploadQueue, setUploadQueue] = useState([]);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [posterVideo, setPosterVideo] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ name: '', template: '标准方案', discount: QUOTE_DISCOUNTS[0].value });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ company: '', logoUrl: '', sales: '' });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    refreshVideos();
    fetchJSON('/api/products').then(setProducts).catch(() => {});
    fetchJSON('/api/orders').then(setOrders).catch(() => {});
    fetchJSON('/api/settings').then(setSettings).catch(() => {});
    fetchJSON('/api/logs').then(setLogs).catch(() => {});
  }, []);

  const handleVideoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    const queueItems = files.map((file) => ({ id: `${file.name}-${Date.now()}`, file, progress: 0, status: 'pending' }));
    setUploadQueue((prev) => [...prev, ...queueItems]);
    const concurrency = 3;
    let index = 0;

    const worker = async () => {
      while (index < queueItems.length) {
        const current = queueItems[index];
        index += 1;
        setUploadQueue((prev) => prev.map((item) => (item.id === current.id ? { ...item, status: 'uploading' } : item)));
        const formData = new FormData();
        formData.append('file', current.file);
        try {
          await uploadFormData('/api/videos/upload', formData, (progress) => {
            setUploadQueue((prev) => prev.map((item) => (item.id === current.id ? { ...item, progress } : item)));
          });
          setUploadQueue((prev) => prev.map((item) => (item.id === current.id ? { ...item, status: 'success', progress: 100 } : item)));
        } catch (error) {
          setUploadQueue((prev) => prev.map((item) => (item.id === current.id ? { ...item, status: 'failed', error: error.message } : item)));
        }
      }
    };

    await Promise.all(new Array(concurrency).fill(null).map(() => worker()));
    refreshVideos();
  };

  const videoColumns = useMemo(
    () => [
      { key: 'title', title: '文件名' },
      { key: 'category', title: '分类' },
      {
        key: 'size',
        title: '大小',
        render: (value) => `${(value / 1024 / 1024).toFixed(2)} MB`
      }
    ],
    []
  );

  const quoteTotal = useMemo(() => {
    if (!quoteForm.items) return 0;
    const sum = quoteForm.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return Math.round(sum * quoteForm.discount);
  }, [quoteForm]);

  if (!user) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>请先登录</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TabBar tabs={TABS} activeKey={active} onChange={setActive} />
      {active === 'videos' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label className="button-primary" style={{ cursor: 'pointer' }}>
              批量上传视频
              <input type="file" accept="video/mp4" multiple style={{ display: 'none' }} onChange={handleVideoUpload} />
            </label>
            <button className="button-ghost" onClick={() => window.open('/api/videos/export')}>批量导出 CSV</button>
            <label className="button-ghost" style={{ cursor: 'pointer' }}>
              导入 CSV
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={async (event) => {
                  const [file] = event.target.files || [];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  await uploadFormData('/api/videos/import', formData);
                  refreshVideos();
                }}
              />
            </label>
          </div>
          <DataTable
            columns={videoColumns}
            data={videos}
            actions={[
              { label: '分类编辑', onClick: (video) => alert(`编辑 ${video.title}`) },
              {
                label: '上传首帧',
                onClick: (video) => {
                  setPosterVideo(video);
                  setShowPosterModal(true);
                }
              }
            ]}
          />
          <div className="glass-card" style={{ padding: '1rem', display: 'grid', gap: '0.5rem' }}>
            <strong>上传队列</strong>
            {uploadQueue.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.file.name}</span>
                <span>
                  {item.progress}% {item.status === 'failed' && <span style={{ color: '#dc2626' }}>失败</span>}
                </span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
            共 {videoMeta.total} 条，当前第 {videoMeta.page}/{Math.ceil(videoMeta.total / videoMeta.pageSize)} 页
          </div>
        </section>
      )}

      {active === 'quotes' && (
        <section className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>模板名称</span>
              <input
                value={quoteForm.name}
                onChange={(event) => setQuoteForm({ ...quoteForm, name: event.target.value })}
                style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>优惠策略</span>
              <select
                value={quoteForm.discount}
                onChange={(event) => setQuoteForm({ ...quoteForm, discount: Number(event.target.value) })}
                style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
              >
                {QUOTE_DISCOUNTS.map((discount) => (
                  <option key={discount.label} value={discount.value}>
                    {discount.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <strong>报价条目</strong>
            <button
              className="button-ghost"
              onClick={() =>
                setQuoteForm({
                  ...quoteForm,
                  items: [...(quoteForm.items || []), { id: Date.now(), name: '新条目', quantity: 1, price: 1000 }]
                })
              }
            >
              添加条目
            </button>
            {(quoteForm.items || []).map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '0.5rem' }}>
                <input
                  value={item.name}
                  onChange={(event) =>
                    setQuoteForm((prev) => ({
                      ...prev,
                      items: prev.items.map((row) => (row.id === item.id ? { ...row, name: event.target.value } : row))
                    }))
                  }
                  style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(event) =>
                    setQuoteForm((prev) => ({
                      ...prev,
                      items: prev.items.map((row) => (row.id === item.id ? { ...row, quantity: Number(event.target.value) } : row))
                    }))
                  }
                  style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={(event) =>
                    setQuoteForm((prev) => ({
                      ...prev,
                      items: prev.items.map((row) => (row.id === item.id ? { ...row, price: Number(event.target.value) } : row))
                    }))
                  }
                  style={{ padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
                />
                <button
                  className="button-ghost"
                  onClick={() =>
                    setQuoteForm((prev) => ({
                      ...prev,
                      items: prev.items.filter((row) => row.id !== item.id)
                    }))
                  }
                >
                  删除
                </button>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: '1.2rem' }}>优惠后总价：￥{quoteTotal.toLocaleString()}</div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="button-ghost" onClick={() => window.print()}>
                打印报价单
              </button>
            </div>
          </div>
        </section>
      )}

      {active === 'orders' && (
        <DataTable columns={[{ key: 'id', title: '订单号' }, { key: 'customer', title: '客户' }, { key: 'status', title: '状态' }]} data={orders} />
      )}

      {active === 'products' && (
        <DataTable columns={[{ key: 'name', title: '商品名称' }, { key: 'model', title: '型号' }, { key: 'price', title: '单价' }]} data={products} />
      )}

      {active === 'contracts' && (
        <section className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="button-ghost" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
            上传合同模板
            <input type="file" accept=".html,.txt" style={{ display: 'none' }} onChange={() => alert('已上传合同模板')} />
          </label>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>支持自定义 HTML 模板，打印时通过浏览器 PDF 生成。</p>
        </section>
      )}

      {active === 'export' && (
        <section className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="button-primary" onClick={() => window.open('/api/export/orders')}>导出订单 CSV</button>
          <button className="button-ghost" onClick={() => window.open('/api/export/products')}>导出商品 CSV</button>
        </section>
      )}

      {active === 'settings' && (
        <section className="glass-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>公司名称</span>
            <input
              value={settings.company}
              onChange={(event) => setSettings({ ...settings, company: event.target.value })}
              style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>LOGO 地址</span>
            <input
              value={settings.logoUrl}
              onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })}
              style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>业务员名单</span>
            <textarea
              value={settings.sales}
              onChange={(event) => setSettings({ ...settings, sales: event.target.value })}
              rows={4}
              style={{ padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.4)' }}
            />
          </label>
        </section>
      )}

      {active === 'maintenance' && (
        <section className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <strong>系统日志</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflow: 'auto' }}>
            {logs.map((log) => (
              <div key={log.id} className="glass-card" style={{ padding: '0.75rem' }}>
                <strong>{log.level}</strong> {log.message}
              </div>
            ))}
          </div>
          <button className="button-ghost" onClick={() => alert('已执行备份流程')}>执行备份</button>
        </section>
      )}

      <Modal
        open={showPosterModal}
        title="上传首帧图"
        onClose={() => setShowPosterModal(false)}
        footer={
          <button className="button-ghost" onClick={() => setShowPosterModal(false)}>
            关闭
          </button>
        }
      >
        {posterVideo && <p>请在前端使用 &lt;canvas&gt; 截取首帧后上传保存。</p>}
      </Modal>
    </div>
  );
}
