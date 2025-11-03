import React, { useEffect, useMemo, useState } from 'react';
import FilterBar from '../components/FilterBar.jsx';
import VideoCard from '../components/VideoCard.jsx';
import Modal from '../components/Modal.jsx';
import { useAppContext } from '../context/app-context.jsx';
import { fetchJSON } from '../utils/http.js';

const EDIT_FIELDS = [
  'productType',
  'fillerModel',
  'autoLine',
  'capType',
  'capacity',
  'feedMode',
  'explosionProof',
  'fillingHead',
  'capArrange',
  'placing',
  'capping',
  'conveyor',
  'buffer',
  'voc',
  'bucketSort',
  'palletizing',
  'weighing',
  'labeling',
  'pallet',
  'boxing',
  'extra'
];

export default function VideoGalleryPage() {
  const { videos, refreshVideos, videoMeta } = useAppContext();
  const [filters, setFilters] = useState({ productType: '灌装机' });
  const [editingVideo, setEditingVideo] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshVideos(1, filters);
  }, [filters]);

  const canLoadMore = useMemo(() => videoMeta.page * videoMeta.pageSize < videoMeta.total, [videoMeta]);

  const handleSave = async () => {
    if (!editingVideo) return;
    setSaving(true);
    try {
      await fetchJSON(`/api/videos/${editingVideo.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingVideo)
      });
      await refreshVideos(1, filters);
      setEditingVideo(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <FilterBar value={filters} onChange={setFilters} />
      <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onEdit={setEditingVideo} />
        ))}
      </section>
      {canLoadMore && (
        <button className="button-ghost" onClick={() => refreshVideos(videoMeta.page + 1, filters)}>
          加载更多
        </button>
      )}
      <Modal
        open={Boolean(editingVideo)}
        title="编辑视频分类"
        onClose={() => setEditingVideo(null)}
        footer={
          <>
            <button className="button-ghost" onClick={() => setEditingVideo(null)}>
              取消
            </button>
            <button className="button-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存修改'}
            </button>
          </>
        }
      >
        {editingVideo && (
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {EDIT_FIELDS.map((key) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{key}</span>
                <input
                  value={editingVideo.meta?.[key] || ''}
                  onChange={(event) =>
                    setEditingVideo((prev) => ({
                      ...prev,
                      meta: { ...prev.meta, [key]: event.target.value }
                    }))
                  }
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.4)'
                  }}
                />
              </label>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
