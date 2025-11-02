import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Download, Pencil, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import { useInView } from './useInView';

interface VideoCardProps {
  video: {
    id: number;
    title: string | null;
    metadata: Record<string, unknown>;
    posterUrl: string | null;
    videoUrl: string;
  };
  onEdit?: (videoId: number) => void;
  onDelete?: (videoId: number) => void;
}

export default function VideoCard({ video, onEdit, onDelete }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '200px' });

  const togglePlay = () => {
    const element = videoRef.current;
    if (!element) return;
    if (playing) {
      element.pause();
      setPlaying(false);
    } else {
      element.play();
      setPlaying(true);
    }
  };

  const toggleMute = () => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = !muted;
    setMuted(element.muted);
  };

  const handleFullscreen = () => {
    const element = videoRef.current;
    element?.requestFullscreen();
  };

  return (
    <div ref={ref} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg">
      {inView ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={video.posterUrl ?? undefined}
          controls={false}
          preload="metadata"
          muted={muted}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        >
          <source src={video.videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div className="flex aspect-video items-center justify-center text-slate-400">加载中...</div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="flex items-center justify-between text-sm text-white">
          <span className="font-semibold">{video.title ?? '未命名视频'}</span>
          <span className="text-xs text-slate-300">{video.metadata?.productType ?? '未分类'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ControlButton icon={playing ? Pause : Play} label={playing ? '暂停' : '播放'} onClick={togglePlay} />
          <ControlButton icon={muted ? VolumeX : Volume2} label={muted ? '取消静音' : '静音'} onClick={toggleMute} />
          <ControlButton icon={Maximize2} label="全屏" onClick={handleFullscreen} />
          <ControlButton icon={Download} label="下载" onClick={() => window.open(video.videoUrl, '_blank')} />
          {onEdit && <ControlButton icon={Pencil} label="编辑" onClick={() => onEdit(video.id)} />}
          {onDelete && <ControlButton icon={Trash2} label="删除" onClick={() => onDelete(video.id)} />}
        </div>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: typeof Play;
  label: string;
  onClick: () => void;
}

function ControlButton({ icon: Icon, label, onClick }: ControlButtonProps) {
  return (
    <Button
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="pointer-events-auto flex items-center gap-2 bg-white/20 px-4 py-2 text-xs text-slate-100 hover:bg-white/40"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
