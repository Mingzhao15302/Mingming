import React from 'react';
import { X } from 'lucide-react';
import { VideoItem } from './VideoCard';

interface PlayerModalProps {
  item: VideoItem | null;
  onClose: () => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative w-full max-w-5xl rounded-3xl bg-slate-900/90 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          <X size={20} />
        </button>
        <video className="aspect-video w-full rounded-2xl" src={item.videoUrl} poster={item.posterUrl} controls autoPlay />
        <div className="mt-4 space-y-2 text-white">
          <h3 className="text-2xl font-semibold">{item.originalName}</h3>
          <p className="text-sm text-white/70">文件名：{item.filename}</p>
          <p className="text-sm text-white/70">分类：{item.category ?? '未分类'}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
