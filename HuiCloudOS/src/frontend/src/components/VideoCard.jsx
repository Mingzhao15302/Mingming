import React, { useEffect, useRef, useState } from 'react';

export default function VideoCard({ video, onEdit, onPlay }) {
  const videoRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = muted;
  }, [muted]);

  return (
    <article className="hc-card" style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
      <div
        className="hc-video-wrapper"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <video ref={videoRef} preload="metadata" poster={video.posterUrl || ''} src={video.streamUrl} controls={false} />
        <div className="hc-video-actions" style={{ opacity: hovered ? 1 : 0 }}>
          <button type="button" onClick={() => onPlay(video)}>
            {videoRef.current && !videoRef.current.paused ? '暂停' : '播放'}
          </button>
          <button type="button" onClick={() => setMuted((v) => !v)}>{muted ? '开启音量' : '静音'}</button>
          <button
            type="button"
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              if (el.requestFullscreen) {
                el.requestFullscreen();
              }
              el.play();
            }}
          >
            全屏
          </button>
          <a
            className="hc-tab"
            href={video.downloadUrl}
            download
            style={{ borderRadius: 'var(--hc-radius-md)', padding: '0.55rem 1rem' }}
          >
            下载
          </a>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.4rem' }}>
        <strong style={{ fontSize: '1.05rem' }}>{video.title || video.filename}</strong>
        <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{video.categorySummary || '未分类'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <button type="button" onClick={() => onEdit(video)} style={{ flex: 1 }}>
          编辑
        </button>
        <button
          type="button"
          onClick={() => {
            const element = videoRef.current;
            if (!element) return;
            if (element.paused) {
              element.play();
            } else {
              element.pause();
            }
          }}
          style={{ flex: 1 }}
        >
          播放/暂停
        </button>
      </div>
    </article>
  );
}
