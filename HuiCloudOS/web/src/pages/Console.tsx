import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import AppShell from '../components/layout/AppShell';
import TabBar from '../components/common/TabBar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { isAuthenticated } from '../app/auth';
import { dropdownFields, multiChoiceFields } from '../components/video/filterConfig';

const tabs = ['视频库', '报价模块', '订单模块', '商品模块', '合同模板', '导出', '设置', '维护'];

interface VideoRecord {
  id: number;
  title: string | null;
  category: string | null;
  metadata: Record<string, any>;
  videoUrl: string;
  posterUrl: string | null;
}

interface UploadItem {
  name: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'success' | 'error';
}

export default function ConsolePage() {
  const [activeTab, setActiveTab] = useState<string>('视频库');
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [editVideo, setEditVideo] = useState<VideoRecord | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/csv.worker.ts', import.meta.url), { type: 'module' });
    const worker = workerRef.current;
    worker.onmessage = async (event) => {
      if (event.data.error) {
        alert(`解析失败：${event.data.error}`);
        return;
      }
      setCsvPreview(event.data.rows ?? []);
    };
    return () => worker.terminate();
  }, []);

  const videosQuery = useQuery({
    queryKey: ['console-videos'],
    queryFn: async () => {
      const response = await axios.get('/api/videos', { params: { page: 1, pageSize: 50 } });
      return response.data.data as VideoRecord[];
    }
  });

  const quotesQuery = useQuery({
    queryKey: ['console-quotes'],
    queryFn: async () => {
      const response = await axios.get('/api/quotes');
      return response.data.data as Array<{ templateId: string; name: string; sections: any[] }>;
    }
  });

  const ordersQuery = useQuery({
    queryKey: ['console-orders'],
    queryFn: async () => {
      const response = await axios.get('/api/orders', { params: { page: 1, pageSize: 20 } });
      return response.data.data as Array<{
        orderNo: string;
        customerName: string;
        total: number;
        status: string;
      }>;
    }
  });

  const productsQuery = useQuery({
    queryKey: ['console-products'],
    queryFn: async () => {
      const response = await axios.get('/api/products', { params: { page: 1, pageSize: 50 } });
      return response.data.data as Array<{ productId: string; name: string; price: number }>;
    }
  });

  const settingsQuery = useQuery({
    queryKey: ['console-settings'],
    queryFn: async () => {
      const response = await axios.get('/api/settings');
      return response.data as { companyName: string; logoUrl: string; salesTeam: string[]; terms: string };
    }
  });

  const settingsForm = useMemo(() => settingsQuery.data, [settingsQuery.data]);

  useEffect(() => {
    if (!isAuthenticated()) {
      setActiveTab('视频库');
    }
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const runUploads = async (files: FileList) => {
    const items = Array.from(files).map<UploadItem>((file) => ({
      name: file.name,
      progress: 0,
      status: 'waiting'
    }));
    setUploadQueue(items);
    const concurrency = 3;
    let pointer = 0;

    const execute = async () => {
      const index = pointer++;
      const file = files[index];
      if (!file) return;
      setUploadQueue((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, status: 'uploading', progress: 10 } : item))
      );
      const formData = new FormData();
      formData.append('videos', file);
      formData.append('metadata', JSON.stringify({ title: file.name, productType: '自动线' }));
      try {
        await axios.post('/api/videos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === index ? { ...item, status: 'success', progress: 100 } : item))
        );
      } catch (error) {
        console.error(error);
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === index ? { ...item, status: 'error', progress: 0 } : item))
        );
      }
      await videosQuery.refetch();
      await execute();
    };

    await Promise.all(Array.from({ length: concurrency }).map(() => execute()));
  };

  const handleVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await runUploads(files);
    event.target.value = '';
  };

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    workerRef.current?.postMessage({ csvText: text });
    const formData = new FormData();
    formData.append('file', file);
    await axios.post('/api/videos/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    await videosQuery.refetch();
    event.target.value = '';
  };

  const handleVideoUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editVideo) return;
    const form = new FormData(event.currentTarget);
    const metadata: Record<string, any> = {};
    dropdownFields.forEach((field) => {
      metadata[field.key] = form.get(field.key) ?? '';
    });
    multiChoiceFields.forEach((field) => {
      metadata[field.key] = form.getAll(field.key);
    });
    await axios.patch(`/api/videos/${editVideo.id}`, {
      title: form.get('title'),
      category: form.get('category'),
      metadata
    });
    setEditVideo(null);
    await videosQuery.refetch();
  };

  const handleSettingsSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const salesTeam = (form.get('salesTeam') as string).split('\n').filter(Boolean);
    await axios.put('/api/settings', {
      companyName: form.get('companyName'),
      logoUrl: form.get('logoUrl'),
      salesTeam,
      terms: form.get('terms')
    });
    await settingsQuery.refetch();
    alert('设置已保存');
  };

  return (
    <AppShell showFooter={false}>
      <Card title="控制台" action={<span className="text-xs text-slate-300">快速管理业务模块</span>}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </Card>

      {activeTab === '视频库' && (
        <div className="space-y-6">
          <Card title="批量导入" action={<span className="text-xs text-slate-300">并发 3</span>}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                上传视频
                <input type="file" multiple accept="video/*" onChange={handleVideoUpload} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                导入 CSV
                <input type="file" accept="text/csv" onChange={handleCsvImport} />
              </label>
              <Button onClick={() => window.open('/api/videos/export/csv', '_blank')}>导出 CSV</Button>
            </div>
            <div className="mt-4 space-y-2">
              {uploadQueue.map((item) => (
                <div key={item.name} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span>{item.status === 'uploading' ? `${item.progress}%` : item.status}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${item.status === 'error' ? 'bg-rose-400' : 'bg-sky-400'}`} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {csvPreview.length > 0 && (
              <div className="mt-4 rounded-2xl bg-white/5 p-4 text-xs text-slate-200">
                预览 {csvPreview.length} 条记录
              </div>
            )}
          </Card>
          <Card title="视频列表" action={<span className="text-xs text-slate-300">支持编辑分类</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm text-slate-100">
                <thead className="text-xs uppercase text-slate-300">
                  <tr>
                    <th className="p-3">标题</th>
                    <th className="p-3">分类</th>
                    <th className="p-3">产品类型</th>
                    <th className="p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {videosQuery.data?.map((video) => (
                    <tr key={video.id} className="border-t border-white/5">
                      <td className="p-3">{video.title ?? '未命名'}</td>
                      <td className="p-3">{video.category ?? '-'}</td>
                      <td className="p-3">{video.metadata?.productType ?? '-'}</td>
                      <td className="p-3">
                        <Button className="bg-white/20 px-4 py-2 text-xs" onClick={() => setEditVideo(video)}>
                          编辑
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === '报价模块' && (
        <Card title="报价模板" action={<span className="text-xs text-slate-300">PDF 导出</span>}>
          <div className="space-y-3">
            {quotesQuery.data?.map((quote) => (
              <div key={quote.templateId} className="flex items-center justify-between rounded-2xl bg-white/5 p-4 text-sm text-slate-100">
                <div>
                  <div className="font-semibold text-white">{quote.name}</div>
                  <div className="text-xs text-slate-300">模板 ID：{quote.templateId}</div>
                </div>
                <Button
                  className="bg-white/20 px-4 py-2 text-xs"
                  onClick={() =>
                    axios.post(`/api/quotes/${quote.templateId}/export`, {
                      title: quote.name,
                      customer: '示例客户',
                      salesperson: '业务员',
                      items: quote.sections ?? [],
                      total: 0
                    })
                  }
                >
                  生成 PDF
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === '订单模块' && (
        <Card title="订单列表" action={<Button onClick={() => window.open('/api/orders/export/csv', '_blank')} className="bg-white/20 px-4 py-2 text-xs">导出 CSV</Button>}>
          <div className="space-y-3">
            {ordersQuery.data?.map((order) => (
              <div key={order.orderNo} className="flex flex-wrap items-center justify-between rounded-2xl bg-white/5 p-4 text-sm text-slate-100">
                <div>
                  <div className="font-semibold text-white">{order.orderNo}</div>
                  <div className="text-xs text-slate-300">客户：{order.customerName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sky-200">¥{order.total.toFixed(2)}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === '商品模块' && (
        <Card title="商品目录" action={<span className="text-xs text-slate-300">来自 /public/products</span>}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {productsQuery.data?.map((product) => (
              <div key={product.productId} className="rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-lg font-semibold text-white">{product.name}</div>
                <div className="text-sky-200">¥{product.price.toFixed(2)}</div>
                <div className="text-xs text-slate-400">ID：{product.productId}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === '合同模板' && (
        <Card title="合同模板" action={<span className="text-xs text-slate-300">支持 PDF 输出</span>}>
          <p className="text-sm text-slate-200">合同模板可通过报价模块导出的 PDF 进行扩展，未来可接入富文本编辑。</p>
        </Card>
      )}

      {activeTab === '导出' && (
        <Card title="一键导出" action={<span className="text-xs text-slate-300">UTF-8 with BOM</span>}>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => window.open('/api/videos/export/csv', '_blank')} className="px-6 py-3 text-base">
              导出视频 CSV
            </Button>
            <Button onClick={() => window.open('/api/orders/export/csv', '_blank')} className="px-6 py-3 text-base">
              导出订单 CSV
            </Button>
          </div>
        </Card>
      )}

      {activeTab === '设置' && settingsForm && (
        <Card title="系统设置" action={<span className="text-xs text-slate-300">公司信息</span>}>
          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSettingsSave}>
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              公司名称
              <input defaultValue={settingsForm.companyName} name="companyName" className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              LOGO 地址
              <input defaultValue={settingsForm.logoUrl} name="logoUrl" className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
              业务员名单
              <textarea defaultValue={settingsForm.salesTeam.join('\n')} name="salesTeam" rows={4} className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
              条款
              <textarea defaultValue={settingsForm.terms} name="terms" rows={6} className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3" />
            </label>
            <div className="md:col-span-2 text-right">
              <Button type="submit" className="px-6 py-3 text-base">
                保存设置
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === '维护' && (
        <Card title="系统维护" action={<span className="text-xs text-slate-300">日志/备份</span>}>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>• 视频文件存储：/web/public/videos</li>
            <li>• 首帧图存储：/web/public/posters</li>
            <li>• PDF 导出目录：/exports/quotes</li>
            <li>• CSV 导出目录：/exports/csv</li>
            <li>• 数据库：server/db/db.sqlite（运行时自动生成）</li>
          </ul>
        </Card>
      )}

      <Modal open={Boolean(editVideo)} onClose={() => setEditVideo(null)} title="编辑视频分类">
        {editVideo && (
          <form className="space-y-4" onSubmit={handleVideoUpdate}>
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              标题
              <input name="title" defaultValue={editVideo.title ?? ''} className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              分类
              <input name="category" defaultValue={editVideo.category ?? ''} className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              {dropdownFields.map((field) => (
                <label key={field.key} className="flex flex-col gap-2 text-xs text-slate-200">
                  {field.label}
                  <select
                    name={field.key}
                    defaultValue={editVideo.metadata?.[field.key] ?? ''}
                    className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100"
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option || '未选择'}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="space-y-3">
              {multiChoiceFields.map((field) => (
                <div key={field.key} className="rounded-2xl bg-white/5 p-3">
                  <div className="mb-2 text-xs font-semibold text-sky-200">{field.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const defaultChecked = Array.isArray(editVideo.metadata?.[field.key])
                        ? (editVideo.metadata?.[field.key] as string[]).includes(option)
                        : false;
                      return (
                        <label key={option} className="flex items-center gap-1 text-xs text-slate-200">
                          <input type="checkbox" name={field.key} value={option} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-white/20 bg-slate-900/60" />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <Button type="submit" className="px-6 py-2 text-base">
                保存
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
}
