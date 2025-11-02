import React, { useCallback, useRef, useState } from 'react';
import { Download, Maximize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export interface VideoItem {
  filename: string;
  originalName: string;
  category?: string;
  posterUrl: string;
  videoUrl: string;
}

interface VideoCardProps {
  item: VideoItem;
  onOpen?: (item: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ item, onOpen }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const openFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (video?.requestFullscreen) {
      video.requestFullscreen();
      video.play();
      setPlaying(true);
    }
  }, []);

  return (
    <article className="group relative overflow-hidden rounded-3xl bg-white/5 shadow-lg transition hover:shadow-glow">
      <video
        ref={videoRef}
        className="aspect-video w-full object-cover"
        poster={item.posterUrl}
        preload="metadata"
        muted={muted}
        playsInline
        controls={false}
        src={item.videoUrl}
      />
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <header className="flex items-center justify-between text-sm text-white">
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-wide">
            {item.category ?? '未分类'}
          </span>
          <button type="button" className="rounded-full bg-black/40 p-2" onClick={() => onOpen?.(item)}>
            详情
          </button>
        </header>
        <div className="flex items-center justify-between">
          <div className="space-y-2 text-white">
            <h3 className="text-lg font-semibold">{item.originalName}</h3>
            <p className="text-xs text-white/70">{item.filename}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={togglePlay} className="rounded-full bg-white/20 p-2 text-black">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" onClick={toggleMute} className="rounded-full bg-white/20 p-2 text-black">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button type="button" onClick={openFullscreen} className="rounded-full bg-white/20 p-2 text-black">
              <Maximize2 size={18} />
            </button>
            <a
              href={item.videoUrl}
              download
              className="rounded-full bg-white/20 p-2 text-black"
              onClick={(event) => event.stopPropagation()}
            >
              <Download size={18} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
