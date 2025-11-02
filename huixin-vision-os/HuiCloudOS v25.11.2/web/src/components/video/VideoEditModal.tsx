import React from 'react';
import { X } from 'lucide-react';
import type { VideoItem } from './VideoCard';

interface VideoEditModalProps {
  video: (VideoItem & { metadata?: Record<string, unknown>; category?: string }) | null;
  onClose: () => void;
  onSave: (payload: { filename: string; category: string; metadata: Record<string, unknown> }) => void;
}

const selectOptions: Array<{ id: string; label: string; options: string[] }> = [
  { id: 'productType', label: '产品类型', options: ['灌装机', '自动线', '码垛机'] },
  { id: 'fillerModel', label: '灌装机型号', options: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'] },
  { id: 'cap', label: '桶盖', options: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'] },
  { id: 'capacity', label: '容量', options: ['0.5~5L', '15~25L', '50L', '200L', '1000L'] },
  { id: 'feed', label: '来料方式', options: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制'] },
  { id: 'explosion', label: '防爆要求', options: ['防爆', '不防爆'] },
  { id: 'fillHeads', label: '灌装方式', options: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'] },
  { id: 'voc', label: 'VOC要求', options: ['一体式集气', '灌装阀集气'] },
];

const VideoEditModal: React.FC<VideoEditModalProps> = ({ video, onClose, onSave }) => {
  const [metadata, setMetadata] = React.useState<Record<string, string>>(() => ({
    ...(video?.metadata ?? {}),
  }));
  const [category, setCategory] = React.useState(video?.category ?? '');

  React.useEffect(() => {
    setMetadata({ ...(video?.metadata ?? {}) } as Record<string, string>);
    setCategory(video?.category ?? '');
  }, [video]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900/95 p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
        >
          <X size={20} />
        </button>
        <h3 className="mb-6 text-2xl font-semibold text-white">编辑分类 · {video.originalName}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {selectOptions.map((option) => (
            <label key={option.id} className="text-sm text-white/70">
              {option.label}
              <select
                value={metadata[option.id] ?? ''}
                onChange={(event) => setMetadata((prev) => ({ ...prev, [option.id]: event.target.value }))}
                className="glass-input mt-2 w-full bg-white/10"
              >
                <option value="">未选择</option>
                {option.options.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <label className="text-sm text-white/70">
            视频分类标签
            <input
              className="glass-input mt-2 w-full"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="请输入分类"
            />
          </label>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="glass-button bg-white/10" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="glass-button"
            onClick={() =>
              onSave({ filename: video.filename, category, metadata })
            }
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditModal;
