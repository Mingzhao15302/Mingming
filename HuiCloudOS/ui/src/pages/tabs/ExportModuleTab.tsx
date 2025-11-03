import { api } from '../../app/api';

export function ExportModuleTab() {
  async function handleBackup() {
    const response = await fetch('/api/export/backup');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'huicloud-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportCsv() {
    const response = await api.exportCsv();
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'videos.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>统一导出</h3>
      <button className="btn" onClick={handleBackup} type="button">
        导出系统备份
      </button>
      <p style={{ color: 'rgba(15,23,42,0.6)' }}>备份包含视频元数据、商品、订单、报价与配置，不包含实际视频文件。</p>
      <button className="btn secondary" onClick={handleExportCsv} type="button">
        导出视频 CSV（浏览器下载）
      </button>
    </div>
  );
}
