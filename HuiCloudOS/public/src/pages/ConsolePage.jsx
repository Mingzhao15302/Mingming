import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tabs } from '../components/Tabs.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { UploadQueue } from '../components/UploadQueue.jsx';
import { Modal } from '../components/Modal.jsx';
import {
  fetchVideos,
  updateVideoMeta,
  deleteVideo,
  uploadVideo,
  importVideosCsv,
  exportVideosCsv,
  fetchQuotes,
  createQuote,
  fetchOrders,
  fetchProducts,
  saveSettings,
  getSettings,
  fetchMaintenance,
  triggerBackup
} from '../utils/api.js';
import { useToast } from '../hooks/useApp.js';
import {
  CATEGORY_OPTIONS,
  FIELD_LABELS,
  FIELD_GROUPS,
  MULTI_GROUPS,
  MULTI_SELECT_FIELDS
} from '../modules/categories.js';
import { useAuth } from '../hooks/useApp.js';

const VideoManager = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [queue, setQueue] = useState([]);
  const workerRef = useRef(null);
  const [csvPreview, setCsvPreview] = useState({ headers: [], records: [] });
  const toast = useToast();
  const concurrency = 3;

  const loadVideos = useCallback(
    async (nextPage = 1) => {
      setLoading(true);
      try {
        const result = await fetchVideos({ page: nextPage, pageSize });
        setItems(result.items);
        setTotal(result.total);
        setPage(nextPage);
      } catch (error) {
        toast.push(error.message || '加载视频失败', 'error');
      } finally {
        setLoading(false);
      }
    },
    [pageSize, toast]
  );

  useEffect(() => {
    loadVideos(1);
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [loadVideos]);

  const startNextUpload = useCallback(() => {
    const active = queue.filter((item) => item.status === '上传中').length;
    if (active >= concurrency) return;
    const next = queue.find((item) => item.status === '排队');
    if (!next) return;
    setQueue((prev) => prev.map((item) => (item.id === next.id ? { ...item, status: '上传中' } : item)));
    uploadVideo({
      file: next.file,
      onProgress: (progress) => {
        setQueue((prev) => prev.map((item) => (item.id === next.id ? { ...item, progress } : item)));
      },
      concurrency: 4
    })
      .then((res) => {
        setQueue((prev) => prev.map((item) => (item.id === next.id ? { ...item, status: '完成', progress: 100 } : item)));
        toast.push(`${next.file.name} 上传成功`);
        loadVideos(page);
      })
      .catch((error) => {
        setQueue((prev) => prev.map((item) => (item.id === next.id ? { ...item, status: '失败' } : item)));
        toast.push(error.message || '上传失败', 'error');
      })
      .finally(() => {
        setTimeout(() => {
          setQueue((prev) => prev.filter((item) => item.status !== '完成'));
        }, 3000);
      });
  }, [queue, concurrency, toast, loadVideos, page]);

  useEffect(() => {
    const active = queue.filter((item) => item.status === '上传中').length;
    const pending = queue.some((item) => item.status === '排队');
    if (pending && active < concurrency) {
      startNextUpload();
    }
  }, [queue, concurrency, startNextUpload]);

  const handleUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const newItems = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      progress: 0,
      status: '排队'
    }));
    setQueue((prev) => [...prev, ...newItems]);
    event.target.value = '';
  };

  const handleRetry = (id) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: '排队', progress: 0 } : item)));
  };

  const handleDelete = async (video) => {
    try {
      await deleteVideo(video.id);
      toast.push('已删除视频');
      loadVideos(page);
    } catch (error) {
      toast.push(error.message || '删除失败', 'error');
    }
  };

  const handleSave = async () => {
    try {
      await updateVideoMeta(editTarget.id, editTarget);
      toast.push('已更新分类信息');
      setEditTarget(null);
      loadVideos(page);
    } catch (error) {
      toast.push(error.message || '更新失败', 'error');
    }
  };

  const handleCsv = async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/csvWorker.js', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (message) => {
        setCsvPreview(message.data);
      };
    }
    const text = await file.text();
    workerRef.current.postMessage(text);
    try {
      await importVideosCsv(file);
      toast.push('CSV 导入完成');
      loadVideos(page);
    } catch (error) {
      toast.push(error.message || '导入失败', 'error');
    }
    event.target.value = '';
  };

  const handleExport = async () => {
    try {
      const csv = await exportVideosCsv({});
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `videos-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.push(error.message || '导出失败', 'error');
    }
  };

  const columns = useMemo(
    () => [
      { key: 'title', header: '标题', render: (value, row) => value || row.originalName },
      { key: 'category', header: '分类', render: (_, row) => row.category?.productType || '-' },
      { key: 'size', header: '大小', render: (value) => `${(value / 1024 / 1024).toFixed(2)} MB` },
      { key: 'createdAt', header: '上传时间', render: (value) => new Date(value).toLocaleString() },
      {
        key: 'actions',
        header: '操作',
        render: (_, row) => (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="button secondary" onClick={() => setEditTarget(row)}>
              编辑
            </button>
            <button className="button secondary" onClick={() => handleDelete(row)}>
              删除
            </button>
          </div>
        )
      }
    ],
    [handleDelete]
  );

  const renderField = (fieldKey) => {
    const options = CATEGORY_OPTIONS[fieldKey] || [];
    return (
      <label key={fieldKey} style={{ display: 'grid', gap: '0.35rem' }}>
        {FIELD_LABELS[fieldKey]}
        <select
          className="select"
          value={editTarget.category?.[fieldKey] || ''}
          onChange={(event) =>
            setEditTarget((prev) => ({
              ...prev,
              category: { ...prev.category, [fieldKey]: event.target.value }
            }))
          }
        >
          <option value="">未配置</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  };

  const renderMulti = (groupKey) => {
    const values = editTarget.category?.[groupKey] || [];
    return (
      <div key={groupKey} className="field" style={{ display: 'grid', gap: '0.5rem' }}>
        <span>{FIELD_LABELS[groupKey]}</span>
        <div className="multi-select">
          {MULTI_SELECT_FIELDS[groupKey].map((option) => {
            const checked = values.includes(option);
            return (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setEditTarget((prev) => {
                      const next = new Set(prev.category?.[groupKey] || []);
                      if (next.has(option)) {
                        next.delete(option);
                      } else {
                        next.add(option);
                      }
                      return {
                        ...prev,
                        category: { ...prev.category, [groupKey]: Array.from(next) }
                      };
                    });
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const editFields = useMemo(() => {
    if (!editTarget) return [];
    const productType = editTarget.category?.productType || '灌装机';
    return FIELD_GROUPS[productType] || [];
  }, [editTarget]);

  const multiFields = useMemo(() => {
    if (!editTarget) return [];
    const productType = editTarget.category?.productType || '灌装机';
    return MULTI_GROUPS[productType] || [];
  }, [editTarget]);

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="table-toolbar">
        <div className="badge">共 {total} 条视频</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label className="button secondary" style={{ cursor: 'pointer' }}>
            批量上传视频
            <input type="file" multiple accept="video/*" hidden onChange={handleUpload} />
          </label>
          <label className="button secondary" style={{ cursor: 'pointer' }}>
            导入 CSV
            <input type="file" accept=".csv" hidden onChange={handleCsv} />
          </label>
          <button className="button" onClick={handleExport}>
            导出 CSV
          </button>
        </div>
      </div>
      {loading ? <div className="status-pill">加载中…</div> : <DataTable columns={columns} data={items} />}
      <UploadQueue items={queue} onRetry={handleRetry} />
      {csvPreview.headers.length > 0 && (
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>CSV 预览</h3>
          <table className="table">
            <thead>
              <tr>
                {csvPreview.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvPreview.records.slice(0, 5).map((record, index) => (
                <tr key={index}>
                  {csvPreview.headers.map((header) => (
                    <td key={header}>{record[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button className="button secondary" disabled={page <= 1} onClick={() => loadVideos(page - 1)}>
          上一页
        </button>
        <button className="button secondary" disabled={page * pageSize >= total} onClick={() => loadVideos(page + 1)}>
          下一页
        </button>
      </div>
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`编辑分类 · ${editTarget?.originalName || ''}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="button secondary" onClick={() => setEditTarget(null)}>
              取消
            </button>
            <button className="button" onClick={handleSave}>
              保存
            </button>
          </div>
        }
      >
        {editTarget && (
          <div className="grid" style={{ gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              {FIELD_LABELS.productType}
              <select
                className="select"
                value={editTarget.category?.productType || ''}
                onChange={(event) =>
                  setEditTarget((prev) => ({
                    ...prev,
                    category: { ...prev.category, productType: event.target.value }
                  }))
                }
              >
                <option value="">未配置</option>
                {CATEGORY_OPTIONS.productType.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            {editFields.map((field) => renderField(field))}
            {multiFields.map((field) => renderMulti(field))}
          </div>
        )}
      </Modal>
    </div>
  );
};

const QuoteModule = () => {
  const [quotes, setQuotes] = useState([]);
  const [template, setTemplate] = useState({ name: '', discount: 0, terms: '' });
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchQuotes();
        setQuotes(result.items);
      } catch (error) {
        toast.push(error.message || '加载报价失败', 'error');
      }
    };
    load();
  }, [toast]);

  const handleCreate = async () => {
    try {
      const created = await createQuote(template);
      setQuotes((prev) => [created, ...prev]);
      setTemplate({ name: '', discount: 0, terms: '' });
      toast.push('已新增报价模板');
    } catch (error) {
      toast.push(error.message || '创建失败', 'error');
    }
  };

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>新建报价模板</h3>
        <input className="input" placeholder="模板名称" value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} />
        <label>
          优惠比例（%）
          <input
            className="input"
            type="number"
            value={template.discount}
            onChange={(e) => setTemplate({ ...template, discount: Number(e.target.value) })}
          />
        </label>
        <textarea
          className="textarea"
          rows={4}
          placeholder="条款说明"
          value={template.terms}
          onChange={(e) => setTemplate({ ...template, terms: e.target.value })}
        />
        <button className="button" onClick={handleCreate}>
          保存模板
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: '模板名称' },
          { key: 'discount', header: '优惠(%)' },
          { key: 'terms', header: '条款' },
          { key: 'createdAt', header: '创建时间', render: (value) => new Date(value).toLocaleString() }
        ]}
        data={quotes}
      />
    </div>
  );
};

const OrdersModule = () => {
  const [orders, setOrders] = useState([]);
  const toast = useToast();
  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchOrders();
        setOrders(result.items);
      } catch (error) {
        toast.push(error.message || '加载订单失败', 'error');
      }
    };
    load();
  }, [toast]);
  return (
    <DataTable
      columns={[
        { key: 'id', header: '订单号' },
        { key: 'customer', header: '客户', render: (value) => value?.company || '-' },
        { key: 'total', header: '订单金额', render: (value) => `￥${value.toLocaleString()}` },
        { key: 'final', header: '应付金额', render: (value) => `￥${value.toLocaleString()}` },
        { key: 'createdAt', header: '创建时间', render: (value) => new Date(value).toLocaleString() }
      ]}
      data={orders}
    />
  );
};

const ProductsModule = () => {
  const [products, setProducts] = useState([]);
  const toast = useToast();
  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchProducts();
        setProducts(result.items);
      } catch (error) {
        toast.push(error.message || '加载商品失败', 'error');
      }
    };
    load();
  }, [toast]);
  return (
    <DataTable
      columns={[
        { key: 'name', header: '名称' },
        { key: 'model', header: '型号' },
        { key: 'price', header: '价格', render: (value) => `￥${value.toLocaleString()}` },
        { key: 'stock', header: '库存' },
        { key: 'updatedAt', header: '更新时间', render: (value) => new Date(value).toLocaleString() }
      ]}
      data={products}
    />
  );
};

const ContractsModule = () => {
  const [templates, setTemplates] = useState([]);
  const toast = useToast();
  const handleUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setTemplates((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, uploadedAt: new Date().toISOString() }))
    ]);
    toast.push('已添加合同模板');
  };
  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <label className="button secondary" style={{ width: 'max-content', cursor: 'pointer' }}>
        上传合同模板
        <input type="file" hidden onChange={handleUpload} />
      </label>
      <DataTable
        columns={[
          { key: 'name', header: '文件名' },
          { key: 'size', header: '大小', render: (value) => `${(value / 1024).toFixed(2)} KB` },
          { key: 'uploadedAt', header: '上传时间', render: (value) => new Date(value).toLocaleString() }
        ]}
        data={templates}
      />
    </div>
  );
};

const ExportModule = () => (
  <div className="grid" style={{ gap: '1rem' }}>
    <button className="button" onClick={() => window.open('/api/videos/export', '_blank')}>
      导出视频 CSV
    </button>
    <button className="button secondary" onClick={() => window.print()}>
      打开打印视图
    </button>
  </div>
);

const SettingsModule = () => {
  const [settings, setSettings] = useState({ company: '', logo: '', sales: '' });
  const toast = useToast();
  useEffect(() => {
    const load = async () => {
      try {
        const result = await getSettings();
        setSettings(result);
      } catch (error) {
        console.warn('读取设置失败', error);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      const result = await saveSettings(settings);
      setSettings(result);
      toast.push('设置已保存');
    } catch (error) {
      toast.push(error.message || '保存失败', 'error');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem', maxWidth: '520px' }}>
      <label>
        公司名称
        <input className="input" value={settings.company} onChange={(e) => setSettings({ ...settings, company: e.target.value })} />
      </label>
      <label>
        Logo 地址
        <input className="input" value={settings.logo} onChange={(e) => setSettings({ ...settings, logo: e.target.value })} />
      </label>
      <label>
        业务员名单
        <textarea
          className="textarea"
          rows={4}
          value={settings.sales}
          onChange={(e) => setSettings({ ...settings, sales: e.target.value })}
        />
      </label>
      <button className="button" onClick={handleSave}>
        保存配置
      </button>
    </div>
  );
};

const MaintenanceModule = () => {
  const [logs, setLogs] = useState([]);
  const toast = useToast();
  const load = useCallback(async () => {
    try {
      const result = await fetchMaintenance();
      setLogs(result.logs);
    } catch (error) {
      toast.push(error.message || '读取日志失败', 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBackup = async () => {
    try {
      await triggerBackup();
      toast.push('备份已创建');
      load();
    } catch (error) {
      toast.push(error.message || '备份失败', 'error');
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <button className="button" onClick={handleBackup}>
        执行备份
      </button>
      <div className="glass-card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>系统日志</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          {logs.map((log) => (
            <li key={log.id} className="glass-card" style={{ padding: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>{log.message}</div>
              <div style={{ color: 'rgba(15,23,42,0.65)' }}>{new Date(log.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ConsolePage = () => {
  const [active, setActive] = useState('videos');
  const { profile } = useAuth();
  const tabs = useMemo(
    () => [
      { key: 'videos', label: '视频库', content: <VideoManager /> },
      { key: 'quotes', label: '报价模块', content: <QuoteModule /> },
      { key: 'orders', label: '订单模块', content: <OrdersModule /> },
      { key: 'products', label: '商品模块', content: <ProductsModule /> },
      { key: 'contracts', label: '合同模板', content: <ContractsModule /> },
      { key: 'exports', label: '导出', content: <ExportModule /> },
      { key: 'settings', label: '设置', content: <SettingsModule /> },
      { key: 'maintenance', label: '维护', content: <MaintenanceModule /> }
    ],
    []
  );

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
      <header className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>控制台</h2>
          <p style={{ margin: 0, color: 'rgba(15,23,42,0.7)' }}>欢迎回来，{profile?.account || '管理员'}</p>
        </div>
      </header>
      <Tabs tabs={tabs} activeKey={active} onChange={setActive} />
    </div>
  );
};

export default ConsolePage;
