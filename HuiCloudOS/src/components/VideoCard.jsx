import React, { useEffect, useRef, useState } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver.js';

export default function VideoCard({ video, onEdit }) {
  const [containerRef, visible] = useIntersectionObserver({ rootMargin: '120px' });
  const videoRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.load();
    }
  }, [visible]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleDownload = () => {
    window.open(`/api/videos/${video.id}/download`);
  };

  return (
    <div
      ref={containerRef}
      className="glass-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '18px',
        aspectRatio: '16 / 9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered ? '0 30px 60px -30px rgba(37, 99, 235, 0.6)' : undefined
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {visible && (
        <video
          ref={videoRef}
          preload="metadata"
          poster={video.posterUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          src={video.streamUrl}
          muted
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '0.75rem',
          background: hovered ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.6))' : 'transparent',
          transition: 'background 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="button-ghost" onClick={handlePlayToggle}>
            播放/暂停
          </button>
          <button className="button-ghost" onClick={handleFullscreen}>
            全屏
          </button>
          <button className="button-ghost" onClick={handleDownload}>
            下载
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ color: 'white', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>{video.title}</div>
          <button className="button-ghost" onClick={() => onEdit?.(video)}>
            编辑
          </button>
        </div>
      </div>
    </div>
  );
}
