import React, { useCallback, useMemo, useState } from 'react';
import { PRODUCT_TABS } from '../utils/constants.js';
import { useAppContext } from '../context/AppContext.jsx';
import { useUploadQueue } from '../hooks/useUploadQueue.js';
import { useCsvWorker } from '../hooks/useCsvWorker.js';
import VideoMetaModal from '../components/VideoMetaModal.jsx';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function useVideoOperations(api, refresh) {
  const csvWorker = useCsvWorker();

  const upload = useCallback(
    (file, onProgress) =>
      new Promise((resolve, reject) => {
        if (file.size > MAX_VIDEO_SIZE) {
          reject(new Error('单个视频不得超过 100MB'));
          return;
        }
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/videos/upload');
        xhr.responseType = 'json';
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            refresh();
            resolve(xhr.response);
          } else {
            reject(new Error(xhr.response?.message || '上传失败'));
          }
        };
        const formData = new FormData();
        formData.append('files', file);
        xhr.send(formData);
      }),
    [refresh]
  );

  const importCsv = useCallback(
    async (file) => {
      const text = await file.text();
      const parsed = await csvWorker.parse(text);
      await api.post('/api/videos/csv/import', { rows: parsed.rows });
      refresh();
      return parsed.rows.length;
    },
    [api, csvWorker, refresh]
  );

  const exportCsv = useCallback(async () => {
    const response = await fetch('/api/videos/csv/export');
    const text = await response.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `huicloud-videos-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const capturePoster = useCallback(
    (video) =>
      new Promise((resolve, reject) => {
        const element = document.createElement('video');
        element.crossOrigin = 'anonymous';
        element.muted = true;
        element.src = video.streamUrl;
        element.preload = 'auto';
        element.onloadeddata = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = element.videoWidth;
            canvas.height = element.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(element, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              async (blob) => {
                if (!blob) {
                  reject(new Error('生成首帧失败'));
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = async () => {
                  try {
                    await api.post(`/api/videos/${video.id}/poster`, { dataUrl: reader.result });
                    refresh();
                    resolve(true);
                  } catch (error) {
                    reject(error);
                  }
                };
                reader.readAsDataURL(blob);
              },
              'image/jpeg',
              0.85
            );
          } catch (error) {
            reject(error);
          }
        };
        element.onerror = () => reject(new Error('加载视频失败'));
      }),
    [api, refresh]
  );

  return { upload, importCsv, exportCsv, capturePoster };
}

export default function ConsolePage() {
  const { api, setVideos, setProducts, setOrders, setQuotes, setSettings } = useAppContext();
  const [activeTab, setActiveTab] = useState('video');
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [message, setMessage] = useState('');

  const refreshVideos = useCallback(async () => {
    const result = await api.get('/api/videos?page=1&pageSize=30');
    setVideos(result);
    setVideoList(result.items);
  }, [api, setVideos]);

  const { upload, importCsv, exportCsv, capturePoster } = useVideoOperations(api, refreshVideos);
  React.useEffect(() => {
    refreshVideos();
  }, [refreshVideos]);

  const { items: uploadTasks, enqueue, retry } = useUploadQueue({ concurrency: 3, uploader: upload });

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= MAX_VIDEO_SIZE);
    const invalid = files.filter((file) => file.size > MAX_VIDEO_SIZE);
    if (invalid.length > 0) {
      setMessage(`以下文件超过 100MB 已忽略：${invalid.map((file) => file.name).join(', ')}`);
    }
    if (validFiles.length) {
      enqueue(validFiles);
    }
    event.target.value = '';
  };

  const handleCsvSelect = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    const count = await importCsv(file);
    setMessage(`导入 ${count} 条记录成功`);
    event.target.value = '';
  };

  const removeVideo = async (id) => {
    await api.delete(`/api/videos/${id}`);
    refreshVideos();
  };

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'video':
        return (
          <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <label className="hc-tab" style={{ padding: '0.65rem 1.2rem', cursor: 'pointer' }}>
                批量导入视频
                <input type="file" accept="video/*" multiple hidden onChange={handleFileSelect} />
              </label>
              <label className="hc-tab" style={{ padding: '0.65rem 1.2rem', cursor: 'pointer' }}>
                导入 CSV
                <input type="file" accept=".csv" hidden onChange={handleCsvSelect} />
              </label>
              <button type="button" onClick={exportCsv}>
                导出 CSV
              </button>
              <button type="button" onClick={refreshVideos}>
                刷新
              </button>
            </div>
            <div className="hc-card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
              <strong>上传队列</strong>
              <div className="hc-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {uploadTasks.map((task) => (
                  <div key={task.id} className="hc-card" style={{ padding: '0.9rem', display: 'grid', gap: '0.45rem' }}>
                    <span>{task.file.name}</span>
                    <progress max="100" value={task.progress} style={{ width: '100%' }} />
                    <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>
                      状态：{task.status}
                      {task.error && `（${task.error}）`}
                    </span>
                    {task.status === 'failed' && (
                      <button type="button" onClick={() => retry(task.id)}>
                        重试
                      </button>
                    )}
                  </div>
                ))}
                {uploadTasks.length === 0 && <span style={{ opacity: 0.6 }}>暂无上传任务</span>}
              </div>
            </div>
            <div className="table-wrapper">
              <table className="hc-table">
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>标题</th>
                    <th>分类</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {videoList.map((video) => (
                    <tr key={video.id}>
                      <td>{video.filename}</td>
                      <td>{video.title || '-'}</td>
                      <td>{video.categorySummary || '未分类'}</td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setSelectedVideo(video)}>
                          编辑
                        </button>
                        <button type="button" onClick={() => capturePoster(video)}>
                          生成首帧图
                        </button>
                        <button type="button" onClick={() => removeVideo(video.id)}>
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'quote':
        return <QuoteTab api={api} setQuotes={setQuotes} />;
      case 'order':
        return <OrderTab api={api} setOrders={setOrders} />;
      case 'product':
        return <ProductTab api={api} setProducts={setProducts} />;
      case 'contract':
        return <ContractTab api={api} />;
      case 'export':
        return <ExportTab api={api} />;
      case 'settings':
        return <SettingsTab api={api} setSettings={setSettings} />;
      case 'maintenance':
        return <MaintenanceTab api={api} />;
      default:
        return null;
    }
  }, [activeTab, api, capturePoster, exportCsv, refreshVideos, removeVideo, setOrders, setProducts, setQuotes, setSettings, uploadTasks, videoList]);

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 className="section-title">控制台</h2>
        <p className="section-subtitle">管理视频、报价、订单、商品等业务模块</p>
      </header>
      {message && <div className="hc-card" style={{ padding: '0.75rem 1rem' }}>{message}</div>}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {PRODUCT_TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={`hc-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {tabContent}
      {selectedVideo && (
        <VideoMetaModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onSave={async (payload) => {
            await api.put(`/api/videos/${selectedVideo.id}`, payload);
            setSelectedVideo(null);
            refreshVideos();
          }}
        />
      )}
    </section>
  );
}

function ProductTab({ api, setProducts }) {
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const result = await api.get('/api/products');
    setProducts(result.items);
    setItems(result.items);
  }, [api, setProducts]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/api/products', form);
    setForm({ name: '', price: '', description: '' });
    load();
  };

  return (
    <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1.2rem' }}>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.9rem' }}>
        <h3 style={{ margin: 0 }}>新增商品</h3>
        <input placeholder="名称" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <input placeholder="价格" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
        <textarea placeholder="描述" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        <button type="submit">保存商品</button>
      </form>
      <div className="table-wrapper">
        <table className="hc-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>价格</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.price}</td>
                <td>{item.description}</td>
                <td>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.delete(`/api/products/${item.id}`);
                      load();
                    }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuoteTab({ api, setQuotes }) {
  const [form, setForm] = useState({ customer: '', contact: '', discount: 0, items: '' });
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const result = await api.get('/api/quotes');
    setQuotes(result.items);
    setItems(result.items);
  }, [api, setQuotes]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/api/quotes', form);
    setForm({ customer: '', contact: '', discount: 0, items: '' });
    load();
  };

  return (
    <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1.2rem' }}>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>报价模板</h3>
        <input placeholder="客户名称" value={form.customer} onChange={(event) => setForm((prev) => ({ ...prev, customer: event.target.value }))} />
        <input placeholder="联系人" value={form.contact} onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))} />
        <input type="number" placeholder="优惠 (%)" value={form.discount} onChange={(event) => setForm((prev) => ({ ...prev, discount: Number(event.target.value) }))} />
        <textarea placeholder="报价项目（用逗号分隔）" value={form.items} onChange={(event) => setForm((prev) => ({ ...prev, items: event.target.value }))} />
        <button type="submit">生成报价</button>
      </form>
      <div className="table-wrapper">
        <table className="hc-table">
          <thead>
            <tr>
              <th>客户</th>
              <th>联系人</th>
              <th>优惠</th>
              <th>项目</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.customer}</td>
                <td>{item.contact}</td>
                <td>{item.discount}%</td>
                <td>{item.items.join('，')}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => {
                      const printable = window.open('', '_blank');
                      printable.document.write(`<!doctype html><html><head><title>报价单</title><style>body{font-family:sans-serif;padding:2rem;}</style></head><body><h1>报价单</h1><p>客户：${item.customer}</p><p>联系人：${item.contact}</p><p>优惠：${item.discount}%</p><ul>${item.items.map((it) => `<li>${it}</li>`).join('')}</ul></body></html>`);
                      printable.document.close();
                      printable.focus();
                      printable.print();
                    }}
                  >
                    打印
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderTab({ api, setOrders }) {
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const result = await api.get('/api/orders');
    setOrders(result.items);
    setItems(result.items);
  }, [api, setOrders]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>订单记录</h3>
      <div className="table-wrapper">
        <table className="hc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>客户</th>
              <th>金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.customer}</td>
                <td>{item.total}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractTab({ api }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', content: '' });

  const load = useCallback(async () => {
    const result = await api.get('/api/contracts');
    setItems(result.items);
  }, [api]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/api/contracts', form);
    setForm({ name: '', content: '' });
    load();
  };

  return (
    <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1.2rem' }}>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>合同模板</h3>
        <input placeholder="模板名称" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <textarea placeholder="合同内容" value={form.content} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} />
        <button type="submit">保存模板</button>
      </form>
      <div className="table-wrapper">
        <table className="hc-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.content.slice(0, 120)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportTab({ api }) {
  const [exports, setExports] = useState([]);

  const createExport = async (type) => {
    const response = await api.post('/api/exports', { type });
    setExports((prev) => [...prev, response]);
  };

  return (
    <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => createExport('videos')}>
          导出视频 CSV
        </button>
        <button type="button" onClick={() => createExport('orders')}>
          导出订单 CSV
        </button>
      </div>
      <div className="table-wrapper">
        <table className="hc-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {exports.map((item, index) => (
              <tr key={`${item.type}-${index}`}>
                <td>{item.type}</td>
                <td>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ api, setSettings }) {
  const [form, setForm] = useState({ company: '', logo: '', agents: '' });

  const load = useCallback(async () => {
    const result = await api.get('/api/settings');
    setSettings(result);
    setForm({
      company: result.company?.name || '',
      logo: result.logo || '',
      agents: (result.sales || []).join(',')
    });
  }, [api, setSettings]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    await api.post('/api/settings', {
      company: { name: form.company },
      logo: form.logo,
      sales: form.agents.split(',').map((item) => item.trim()).filter(Boolean)
    });
    load();
  };

  return (
    <form onSubmit={submit} className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '0.9rem' }}>
      <h3 style={{ margin: 0 }}>系统设置</h3>
      <input placeholder="公司名称" value={form.company} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} />
      <input placeholder="Logo 地址" value={form.logo} onChange={(event) => setForm((prev) => ({ ...prev, logo: event.target.value }))} />
      <textarea placeholder="业务员名单，用逗号分隔" value={form.agents} onChange={(event) => setForm((prev) => ({ ...prev, agents: event.target.value }))} />
      <button type="submit">保存设置</button>
    </form>
  );
}

function MaintenanceTab({ api }) {
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    const result = await api.get('/api/maintenance');
    setLogs(result.logs);
  }, [api]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="hc-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" onClick={() => api.post('/api/maintenance/backup').then(load)}>
          创建备份
        </button>
        <button type="button" onClick={() => api.post('/api/maintenance/purge').then(load)}>
          清理日志
        </button>
      </div>
      <div className="hc-card" style={{ maxHeight: '360px', overflowY: 'auto', padding: '1rem' }}>
        {logs.map((log, index) => (
          <div key={index} style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.4rem' }}>
            {log}
          </div>
        ))}
        {logs.length === 0 && <span style={{ opacity: 0.6 }}>暂无日志</span>}
      </div>
    </div>
  );
}
