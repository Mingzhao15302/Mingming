import { VideoItem } from '../app/AppContext';

interface VideoModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  if (!video) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{video.title}</h2>
          <button className="btn secondary" style={{ padding: '0.45rem 1rem' }} onClick={onClose}>
            关闭
          </button>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <video
            controls
            style={{ width: '100%', borderRadius: '18px', boxShadow: '0 18px 40px rgba(15,23,42,0.35)' }}
            src={`/api/static/videos/${video.filename}`}
            preload="metadata"
            poster={video.poster ? `/api/static/posters/${video.poster}` : undefined}
          />
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(15,23,42,0.65)' }}>
            <p style={{ margin: '0 0 0.75rem' }}>原始文件：{video.originalName}</p>
            <p style={{ margin: 0 }}>分类：{video.categories?.join(' / ') || '未分类'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
