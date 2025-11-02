import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiBaseUrl, apiFetch } from '../app/store';
import VideoEditModal from '../components/video/VideoEditModal';
import type { VideoItem } from '../components/video/VideoCard';

interface UploadJob {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

const tabs = [
  { id: 'videos', label: '视频库' },
  { id: 'quotes', label: '报价模块' },
  { id: 'orders', label: '订单模块' },
  { id: 'products', label: '商品模块' },
  { id: 'contracts', label: '合同模板' },
  { id: 'exports', label: '导出' },
  { id: 'settings', label: '设置' },
  { id: 'maintenance', label: '维护' },
];

const ConsolePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [videoModal, setVideoModal] = useState<(VideoItem & { metadata?: Record<string, unknown>; category?: string }) | null>(
    null
  );
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const queryClient = useQueryClient();
  const videoQuery = useQuery({
    queryKey: ['console', 'videos'],
    queryFn: () => apiFetch<{ data: Array<VideoItem & { metadata?: Record<string, unknown>; category?: string }> }>('/videos'),
  });

  const productsQuery = useQuery({ queryKey: ['console', 'products'], queryFn: () => apiFetch('/products') });
  const ordersQuery = useQuery({ queryKey: ['console', 'orders'], queryFn: () => apiFetch('/orders') });
  const quotesQuery = useQuery({ queryKey: ['console', 'quotes'], queryFn: () => apiFetch('/quotes') });
  const settingsQuery = useQuery({ queryKey: ['console', 'settings'], queryFn: () => apiFetch('/settings') });
  const [settingsForm, setSettingsForm] = useState<{ company_name?: string; logo_path?: string; sales_team?: string[]; terms?: string } | null>(null);

  const updateSettings = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch('/settings', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => settingsQuery.refetch(),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettingsForm(settingsQuery.data as typeof settingsForm);
    }
  }, [settingsQuery.data]);

  const worker = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../workers/csv.worker.ts', import.meta.url), { type: 'module' });
  }, []);

  useEffect(() => {
    return () => worker?.terminate();
  }, [worker]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);
    setUploadJobs(files.map((file) => ({ name: file.name, status: 'pending' })));
    const concurrency = 3;
    let pointer = 0;

    const uploadSingle = async (file: File, index: number) => {
      setUploadJobs((jobs) => jobs.map((job, i) => (i === index ? { ...job, status: 'uploading' } : job)));
      try {
        const formData = new FormData();
        formData.append('files', file);
        const response = await fetch(`${apiBaseUrl}/videos/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error(await response.text());
        setUploadJobs((jobs) => jobs.map((job, i) => (i === index ? { ...job, status: 'success' } : job)));
      } catch (error) {
        setUploadJobs((jobs) =>
          jobs.map((job, i) =>
            i === index
              ? { ...job, status: 'error', message: error instanceof Error ? error.message : '上传失败' }
              : job
          )
        );
      }
    };

    const workers = Array.from({ length: concurrency }, async () => {
      while (pointer < files.length) {
        const current = pointer;
        pointer += 1;
        await uploadSingle(files[current], current);
      }
    });

    await Promise.all(workers);
    queryClient.invalidateQueries({ queryKey: ['console', 'videos'] });
  };

  const handleSaveVideo = async (payload: { filename: string; category: string; metadata: Record<string, unknown> }) => {
    await apiFetch(`/videos/${payload.filename}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    setVideoModal(null);
    queryClient.invalidateQueries({ queryKey: ['console', 'videos'] });
  };

  const handleExportVideos = async () => {
    const response = await apiFetch<{ path: string }>('/videos/export', { method: 'POST', body: JSON.stringify({}) });
    alert(`已生成视频 CSV：${response.path}`);
  };

  const handleImportCsv = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    if (!worker) return;
    worker.postMessage({ csv: text });
    worker.onmessage = async (event) => {
      if (event.data.error) {
        alert(event.data.error);
        return;
      }
      await apiFetch('/videos/import', {
        method: 'POST',
        body: JSON.stringify({ records: event.data.records }),
      });
      queryClient.invalidateQueries({ queryKey: ['console', 'videos'] });
    };
  };

  const handleOrderExport = async () => {
    const response = await apiFetch<{ path: string }>('/orders/export', { method: 'POST', body: JSON.stringify({}) });
    alert(`订单导出完成：${response.path}`);
  };

  const renderVideosTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white/10 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">视频上传</h3>
          <p className="text-sm text-white/60">单个文件限制 100MB，系统自动生成首帧图与记录。</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="glass-button cursor-pointer">
            批量上传视频
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(event) => handleUpload(event.target.files)}
            />
          </label>
          <label className="glass-button cursor-pointer bg-white/10">
            导入 CSV
            <input type="file" accept=".csv" className="hidden" onChange={(event) => handleImportCsv(event.target.files?.[0] ?? null)} />
          </label>
          <button type="button" className="glass-button bg-white/10" onClick={handleExportVideos}>
            导出 CSV
          </button>
        </div>
      </div>
      {uploadJobs.length > 0 && (
        <div className="glass-card space-y-3 p-4">
          <h4 className="text-white/80">上传队列（并发 3）</h4>
          {uploadJobs.map((job) => (
            <div key={job.name} className="flex items-center justify-between text-sm text-white/70">
              <span>{job.name}</span>
              <span>
                {job.status === 'pending' && '等待中'}
                {job.status === 'uploading' && '上传中...'}
                {job.status === 'success' && '完成'}
                {job.status === 'error' && `失败：${job.message}`}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-3xl bg-white/10 shadow-lg">
        <table className="min-w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
            <tr>
              <th className="px-4 py-3">文件名</th>
              <th className="px-4 py-3">原始名称</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {videoQuery.data?.data.map((video) => (
              <tr key={video.filename} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">{video.filename}</td>
                <td className="px-4 py-3">{video.originalName}</td>
                <td className="px-4 py-3">{video.category ?? '未分类'}</td>
                <td className="px-4 py-3">
                  <button type="button" className="glass-button bg-white/10 px-4 py-2" onClick={() => setVideoModal(video)}>
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQuotesTab = () => (
    <div className="glass-card space-y-4 p-6">
      <h3 className="text-xl font-semibold text-white">报价模板</h3>
      <p className="text-sm text-white/60">在结算页生成的报价数据会同步到此处，可在后端导出 PDF。</p>
      <ul className="space-y-3 text-white/80">
        {quotesQuery.data?.data?.map((quote: any) => (
          <li key={quote.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <span>{quote.title}</span>
            <span className="text-sm text-white/50">折扣：{(quote.discount ?? 0) * 100}%</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">订单列表</h3>
        <button type="button" className="glass-button bg-white/10" onClick={handleOrderExport}>
          导出订单 CSV
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white/10">
        <table className="min-w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
            <tr>
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">客户</th>
              <th className="px-4 py-3">业务员</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.data?.data?.map((order: any) => (
              <tr key={order.id} className="border-t border-white/5">
                <td className="px-4 py-3">{order.id}</td>
                <td className="px-4 py-3">{order.customer_name}</td>
                <td className="px-4 py-3">{order.salesperson}</td>
                <td className="px-4 py-3">¥{order.total?.toLocaleString?.() ?? order.total}</td>
                <td className="px-4 py-3">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="glass-card space-y-4 p-6">
      <h3 className="text-xl font-semibold text-white">商品目录</h3>
      <p className="text-sm text-white/60">商品管理示例，实际数据可通过 API 扩展。</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {productsQuery.data?.data?.map((product: any) => (
          <li key={product.id} className="rounded-2xl bg-white/5 px-4 py-3">
            <h4 className="text-lg text-white">{product.name}</h4>
            <p className="text-sm text-white/60">¥{product.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderContractsTab = () => (
    <div className="glass-card space-y-4 p-6">
      <h3 className="text-xl font-semibold text-white">合同模板</h3>
      <p className="text-sm text-white/60">
        合同模板可通过报价模块生成或在此上传 PDF 模板，当前示例默认与报价数据保持同步。
      </p>
      <button type="button" className="glass-button bg-white/10">
        上传合同模板
      </button>
    </div>
  );

  const renderExportsTab = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="glass-card space-y-3 p-6">
        <h3 className="text-xl font-semibold text-white">视频 CSV</h3>
        <p className="text-sm text-white/60">导出 UTF-8 with BOM 格式，兼容 Excel。</p>
        <button type="button" className="glass-button bg-white/10" onClick={handleExportVideos}>
          导出视频库
        </button>
      </div>
      <div className="glass-card space-y-3 p-6">
        <h3 className="text-xl font-semibold text-white">订单 CSV</h3>
        <button type="button" className="glass-button bg-white/10" onClick={handleOrderExport}>
          导出订单数据
        </button>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="glass-card space-y-4 p-6">
      <h3 className="text-xl font-semibold text-white">公司信息设置</h3>
      <label className="block text-sm text-white/70">
        公司名称
        <input
          className="glass-input mt-2 w-full"
          value={settingsForm?.company_name ?? ''}
          onChange={(event) => setSettingsForm((prev) => ({ ...(prev ?? {}), company_name: event.target.value }))}
        />
      </label>
      <label className="block text-sm text-white/70">
        业务员名单（逗号分隔）
        <input
          className="glass-input mt-2 w-full"
          value={(settingsForm?.sales_team ?? []).join(', ')}
          onChange={(event) =>
            setSettingsForm((prev) => ({
              ...(prev ?? {}),
              sales_team: event.target.value.split(',').map((item) => item.trim()),
            }))
          }
        />
      </label>
      <label className="block text-sm text-white/70">
        条款
        <textarea
          className="glass-input mt-2 w-full"
          rows={4}
          value={settingsForm?.terms ?? ''}
          onChange={(event) => setSettingsForm((prev) => ({ ...(prev ?? {}), terms: event.target.value }))}
        />
      </label>
      <button
        type="button"
        className="glass-button"
        onClick={() => settingsForm && updateSettings.mutate(settingsForm)}
        disabled={updateSettings.isPending || !settingsForm}
      >
        {updateSettings.isPending ? '保存中...' : '保存设置'}
      </button>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="glass-card space-y-4 p-6">
      <h3 className="text-xl font-semibold text-white">系统维护</h3>
      <ul className="list-disc space-y-2 pl-6 text-white/70">
        <li>定期备份 `HuiCloudOS v25.11.2/exports` 与 `web/public/videos` 目录。</li>
        <li>监控上传队列与磁盘空间，确保 2,000+ 视频稳定运行。</li>
        <li>使用 Node.js 20 LTS，保持依赖安全更新。</li>
      </ul>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl px-4 py-2 text-sm transition ${
              activeTab === tab.id ? 'bg-cyan-500/50 text-white shadow-glow' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'videos' && renderVideosTab()}
      {activeTab === 'quotes' && renderQuotesTab()}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'contracts' && renderContractsTab()}
      {activeTab === 'exports' && renderExportsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'maintenance' && renderMaintenanceTab()}

      <VideoEditModal video={videoModal} onClose={() => setVideoModal(null)} onSave={handleSaveVideo} />
    </section>
  );
};

export default ConsolePage;
