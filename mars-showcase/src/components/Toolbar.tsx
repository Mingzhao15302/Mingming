import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useStore';

export const Toolbar: React.FC = () => {
  const addMarker = useAppStore((state) => state.addMarker);
  const exportData = useAppStore((state) => state.exportData);
  const importData = useAppStore((state) => state.importData);
  const queueToast = useAppStore((state) => state.queueToast);
  const generatePresetMarkers = useAppStore((state) => state.generatePresetMarkers);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAddMarker = async () => {
    const marker = await addMarker({ latitude: 0, longitude: 0 });
    queueToast(`已创建标注：${marker.name}`);
  };

  const handleExport = async () => {
    const payload = await exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mars-showcase-export-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    queueToast('导出完成，请妥善保存 JSON 文件', 'success');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const onImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await importData(data);
      queueToast('导入成功', 'success');
    } catch (error) {
      console.error(error);
      queueToast('导入失败，请检查 JSON 文件', 'error');
    }
    event.target.value = '';
  };

  const handleResetView = () => {
    window.dispatchEvent(new CustomEvent('mars-reset-view'));
  };

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;
    await deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    queueToast(outcome === 'accepted' ? '已安装 PWA' : '已取消安装');
    deferredPromptRef.current = null;
    setCanInstall(false);
  };

  const handleGeneratePresets = async () => {
    await generatePresetMarkers();
    queueToast('已生成 17 条自动线标注', 'success');
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/70 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className="rounded bg-sky-500 px-3 py-1 text-white" onClick={handleAddMarker}>
          新增标注
        </button>
        <button className="rounded bg-emerald-500 px-3 py-1 text-white" onClick={handleExport}>
          导出 JSON
        </button>
        <button className="rounded bg-indigo-500 px-3 py-1 text-white" onClick={handleImport}>
          导入 JSON
        </button>
        <button className="rounded bg-slate-700 px-3 py-1 text-white" onClick={handleResetView}>
          重置视角
        </button>
        <button className="rounded bg-amber-500 px-3 py-1 text-white" onClick={handleGeneratePresets}>
          生成 17 条自动线
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          className="rounded border border-sky-500 px-3 py-1 text-sky-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
          disabled={!canInstall}
          onClick={handleInstall}
        >
          安装 PWA
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImportFile}
      />
    </header>
  );
};
