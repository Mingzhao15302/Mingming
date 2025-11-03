import { useEffect, useRef, useState } from 'react';
import { VideoItem } from '../app/AppContext';

interface VideoCardProps {
  item: VideoItem;
  onEdit: (video: VideoItem) => void;
  onDelete: (video: VideoItem) => void;
  onPlay: (video: VideoItem) => void;
}

export function VideoCard({ item, onEdit, onDelete, onPlay }: VideoCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const posterUrl = item.poster ? `/api/static/posters/${item.poster}` : undefined;

  return (
    <div
      ref={ref}
      className="glass"
      style={{
        borderRadius: '18px',
        padding: '1rem',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hover ? '0 28px 60px rgba(59,130,246,0.25)' : '0 18px 40px rgba(15,23,42,0.18)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          aspectRatio: '16 / 9',
          background: 'rgba(148,163,184,0.25)',
        }}
      >
        {visible ? (
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            preload="metadata"
            poster={posterUrl}
            src={`/api/static/videos/${item.filename}`}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(148,163,184,0.2)' }} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            opacity: hover ? 1 : 0,
            transition: 'opacity 0.2s ease',
            background: hover ? 'rgba(15,23,42,0.35)' : 'transparent',
          }}
        >
          <button className="btn" style={{ padding: '0.5rem 1rem' }} onClick={() => onPlay(item)}>
            播放
          </button>
          <button className="btn secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => onEdit(item)}>
            编辑
          </button>
          <button className="btn secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => onDelete(item)}>
            删除
          </button>
        </div>
      </div>
      <div style={{ marginTop: '0.85rem' }}>
        <div style={{ fontWeight: 600 }}>{item.title}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.6)' }}>上传于 {new Date(item.uploadedAt).toLocaleString()}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
          {item.categories?.map((category) => (
            <span key={category} className="tag">
              {category}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
