import React, { useEffect, useRef, useState } from 'react';

export const VideoCard = ({ video, onPreview, onEdit, onDelete, onPosterCapture }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isVisible, setVisible] = useState(false);
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const element = videoRef.current;
    const capturePoster = async () => {
      if (!onPosterCapture) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = element.videoWidth;
        canvas.height = element.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        await onPosterCapture(video.id, dataUrl);
      } catch (error) {
        console.error('Poster capture failed', error);
      }
    };

    element.addEventListener('loadeddata', capturePoster, { once: true });

    return () => {
      element.removeEventListener('loadeddata', capturePoster);
    };
  }, [video.id, onPosterCapture]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="video-card fade-in" ref={containerRef} tabIndex={0}>
      {isVisible ? (
        <video
          ref={videoRef}
          src={video.streamUrl}
          poster={video.posterUrl || undefined}
          preload="metadata"
          controls={false}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'rgba(15,23,42,0.5)' }} />
      )}
      <div className="controls">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="control-button" onClick={togglePlayback} aria-label="播放/暂停">
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button className="control-button" onClick={handleFullscreen} aria-label="全屏">
            ⛶
          </button>
          <button className="control-button" onClick={() => onPreview?.(video)} aria-label="预览">
            🔍
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="control-button" onClick={() => onEdit?.(video)} aria-label="编辑">
            ✏️
          </button>
          <button className="control-button" onClick={() => onDelete?.(video)} aria-label="删除">
            🗑
          </button>
          <a className="control-button" href={video.downloadUrl} download aria-label="下载">
            ⬇️
          </a>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '1rem',
          top: '1rem',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '0.35rem 0.75rem',
          borderRadius: '12px',
          color: 'white',
          fontSize: '0.9rem'
        }}
      >
        {video.title || video.originalName}
      </div>
    </div>
  );
};

export default VideoCard;
