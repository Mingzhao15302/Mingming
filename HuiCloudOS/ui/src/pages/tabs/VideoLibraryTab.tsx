import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useApp, VideoItem } from '../../app/AppContext';
import { api } from '../../app/api';
import { VideoEditModal } from '../../components/VideoEditModal';

interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const CONCURRENCY = 3;

export function VideoLibraryTab() {
  const { videos, refreshVideos } = useApp();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const busyIds = useRef(new Set<string>());

  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/csvWorker.ts', import.meta.url), { type: 'module' });
    const worker = workerRef.current;
    worker.addEventListener('message', (event) => {
      const { success, rows, message } = event.data;
      if (success) {
        setCsvPreview(rows);
      } else {
        alert(`解析失败: ${message}`);
      }
    });
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    const uploading = tasks.filter((task) => task.status === 'uploading').length;
    const availableSlots = CONCURRENCY - uploading;
    if (availableSlots <= 0) return;
    const nextTasks = tasks.filter((task) => task.status === 'pending').slice(0, availableSlots);
    nextTasks.forEach((task) => startUpload(task.id));
  }, [tasks]);

  const taskTable = useMemo(() => tasks.slice().sort((a, b) => a.id.localeCompare(b.id)), [tasks]);

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const newTasks: UploadTask[] = files.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      status: 'pending',
      progress: 0,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
    event.target.value = '';
  }

  function startUpload(id: string) {
    if (busyIds.current.has(id)) return;
    busyIds.current.add(id);
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status: 'uploading', progress: 5 } : task)));
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    api
      .uploadVideo(task.file)
      .then((result: any) => {
        const video = result?.video;
        if (video?.id) {
          return capturePoster(task.file, video.id);
        }
        return undefined;
      })
      .then(() => refreshVideos({ page: 1, pageSize: 30 }))
      .then(() => {
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'success', progress: 100 } : item)));
      })
      .catch((error) => {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'error',
                  progress: 100,
                  error: error instanceof Error ? error.message : '上传失败',
                }
              : item
          )
        );
      })
      .finally(() => {
        busyIds.current.delete(id);
      });
  }

  function capturePoster(file: File, videoId: string) {
    return new Promise<void>((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        URL.revokeObjectURL(video.src);
      };

      const handleCapture = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            cleanup();
            resolve();
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          await api.savePoster(videoId, dataUrl);
        } catch (error) {
          console.warn('生成首帧图失败', error);
        } finally {
          cleanup();
          resolve();
        }
      };

      video.addEventListener('loadeddata', () => {
        try {
          video.currentTime = Math.min(0.1, video.duration || 0.1);
        } catch (error) {
          handleCapture();
        }
      });

      video.addEventListener('seeked', handleCapture, { once: true });
      video.addEventListener('error', () => {
        cleanup();
        resolve();
      });
    });
  }

  async function handleCsvImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    workerRef.current?.postMessage({ id: file.name, text });
    await api.importCsv(file);
    await refreshVideos({ page: 1, pageSize: 30 });
    event.target.value = '';
  }

  async function handleExport() {
    const response = await api.exportCsv();
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'videos.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveVideo(changes: Partial<VideoItem>) {
    if (!editing) return;
    api
      .updateVideo(editing.id, changes)
      .then(() => refreshVideos({ page: 1, pageSize: 30 }))
      .finally(() => setEditing(null));
  }

  function handleDeleteVideo(video: VideoItem) {
    if (!window.confirm(`确定删除视频「${video.title}」吗？`)) return;
    api
      .deleteVideo(video.id)
      .then(() => refreshVideos({ page: 1, pageSize: 30 }))
      .catch((error) => {
        console.error('删除失败', error);
      });
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section className="glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>批量导入</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <label className="btn" style={{ cursor: 'pointer' }}>
            批量上传视频
            <input type="file" multiple accept="video/*" onChange={handleSelectFiles} style={{ display: 'none' }} />
          </label>
          <label className="btn secondary" style={{ cursor: 'pointer' }}>
            导入 CSV
            <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
          </label>
          <button className="btn secondary" onClick={handleExport} type="button">
            导出 CSV
          </button>
        </div>
        {csvPreview.length > 0 && (
          <div className="glass-inline" style={{ marginTop: '1.5rem', padding: '1rem' }}>
            已解析 {csvPreview.length} 条数据，字段：{Object.keys(csvPreview[0] ?? {}).join(', ')}
          </div>
        )}
      </section>

      <section className="glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>上传队列</h3>
        {taskTable.length === 0 ? (
          <p style={{ color: 'rgba(15,23,42,0.55)' }}>暂无上传任务</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>状态</th>
                <th>进度</th>
                <th>错误信息</th>
              </tr>
            </thead>
            <tbody>
              {taskTable.map((task) => (
                <tr key={task.id}>
                  <td>{task.file.name}</td>
                  <td>{task.status}</td>
                  <td>{task.progress}%</td>
                  <td style={{ color: '#b91c1c' }}>{task.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="glass" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>视频列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>文件</th>
              <th>大小</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td>{video.title}</td>
                <td>{video.categories?.join(' / ') ?? '未分类'}</td>
                <td>{video.originalName}</td>
                <td>{video.sizeMb?.toFixed?.(2) ?? video.sizeMb} MB</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn secondary" style={{ padding: '0.35rem 0.8rem' }} onClick={() => setEditing(video)}>
                      编辑分类
                    </button>
                    <button className="btn secondary" style={{ padding: '0.35rem 0.8rem' }} onClick={() => handleDeleteVideo(video)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <VideoEditModal video={editing} onClose={() => setEditing(null)} onSave={handleSaveVideo} />
    </div>
  );
}
