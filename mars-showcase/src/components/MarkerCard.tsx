import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/useStore';
import type { MediaAsset } from '../three/types';

const fieldClass = 'w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm';

export const MarkerCard: React.FC = () => {
  const selectedMarkerId = useAppStore((state) => state.selectedMarkerId);
  const markers = useAppStore((state) => state.markers);
  const mediaAssets = useAppStore((state) => state.mediaAssets);
  const updateMarker = useAppStore((state) => state.updateMarker);
  const addMedia = useAppStore((state) => state.addMedia);
  const removeMedia = useAppStore((state) => state.removeMedia);
  const queueToast = useAppStore((state) => state.queueToast);
  const getBlobUrl = useAppStore((state) => state.getBlobUrl);

  const marker = useMemo(
    () => markers.find((item) => item.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId]
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(marker?.name ?? '');
    setDescription(marker?.description ?? '');
  }, [marker?.id]);

  useEffect(() => {
    let active = true;
    const loadPreviews = async () => {
      if (!marker) {
        setPreviews((prev) => {
          Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
          return {};
        });
        return;
      }
      const markerMedia = mediaAssets.filter((asset) => asset.markerId === marker.id);
      const entries = await Promise.all(
        markerMedia.map(async (asset) => {
          const url = await getBlobUrl(asset.blobKey);
          return [asset.id, url ?? ''] as const;
        })
      );
      if (!active) return;
      setPreviews((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        const map: Record<string, string> = {};
        entries.forEach(([id, url]) => {
          if (url) map[id] = url;
        });
        return map;
      });
    };
    void loadPreviews();
    return () => {
      active = false;
    };
  }, [marker?.id, mediaAssets, getBlobUrl]);

  useEffect(
    () => () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    },
    [previews]
  );

  if (!marker) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-sm text-slate-400">
        请选择一个标注或在火星表面点击以创建新标注。
      </div>
    );
  }

  const markerMedia = mediaAssets.filter((asset) => asset.markerId === marker.id);

  const handleCommit = async () => {
    await updateMarker(marker.id, { name, description });
    queueToast('标注信息已保存', 'success');
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video'
  ) => {
    if (!event.target.files?.length) return;
    const files = Array.from(event.target.files);
    for (const file of files) {
      await addMedia(marker.id, file, type);
    }
    queueToast('媒体已上传', 'success');
    event.target.value = '';
  };

  const handleRemove = async (asset: MediaAsset) => {
    await removeMedia(asset.id);
    queueToast('已删除媒体', 'info');
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
          名称
        </label>
        <input
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={handleCommit}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
          描述
        </label>
        <textarea
          className={`${fieldClass} min-h-[140px]`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={handleCommit}
        />
      </div>
      <div className="grid gap-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
            上传图片
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleFileUpload(event, 'image')}
            className="text-xs text-slate-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
            上传视频
          </label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(event) => handleFileUpload(event, 'video')}
            className="text-xs text-slate-300"
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          媒体列表
        </h3>
        <div className="flex flex-col gap-3">
          {markerMedia.length === 0 && (
            <p className="text-xs text-slate-500">暂无媒体，请通过上方上传。</p>
          )}
          {markerMedia.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col gap-2 rounded border border-slate-700 bg-slate-800 p-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{asset.fileName}</span>
                <button
                  className="text-rose-400 hover:text-rose-300"
                  onClick={() => handleRemove(asset)}
                >
                  删除
                </button>
              </div>
              {asset.type === 'image' && previews[asset.id] && (
                <img
                  src={previews[asset.id]}
                  alt={asset.fileName}
                  className="max-h-40 w-full rounded object-cover"
                />
              )}
              {asset.type === 'video' && previews[asset.id] && (
                <video
                  src={previews[asset.id]}
                  controls
                  className="max-h-40 w-full rounded"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
