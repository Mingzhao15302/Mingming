import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchVideos, uploadPoster } from '../utils/api.js';
import { FilterBar } from '../components/FilterBar.jsx';
import { VideoCard } from '../components/VideoCard.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../hooks/useApp.js';

const PAGE_SIZE = 30;

const buildQuery = (filters) => {
  const params = { pageSize: PAGE_SIZE };
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return;
    params[key] = Array.isArray(value) ? value.join(',') : value;
  });
  return params;
};

const GalleryPage = () => {
  const [filters, setFilters] = useState({ productType: '灌装机' });
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const sentinelRef = useRef(null);
  const toast = useToast();

  const loadVideos = useCallback(
    async (nextPage, reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const params = buildQuery(filters);
        params.page = nextPage;
        const result = await fetchVideos(params);
        setHasMore(result.hasMore);
        setPage(nextPage);
        setVideos((prev) => (reset ? result.items : [...prev, ...result.items]));
      } catch (error) {
        toast.push(error.message || '加载视频失败', 'error');
      } finally {
        setLoading(false);
      }
    },
    [filters, loading, toast]
  );

  useEffect(() => {
    loadVideos(1, true);
  }, [filters, loadVideos]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loading && hasMore) {
          loadVideos(page + 1);
        }
      });
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef, loadVideos, page, hasMore, loading]);

  const posterHandler = useCallback(async (id, dataUrl) => {
    try {
      await uploadPoster(id, dataUrl);
    } catch (error) {
      console.warn('Poster upload failed', error);
    }
  }, []);

  const filterCount = useMemo(() => videos.length, [videos]);

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="table-toolbar">
        <div className="badge">共 {filterCount} 条视频</div>
        {loading && <div className="status-pill">加载中…</div>}
      </div>
      <section className="card-grid gallery">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPreview={setPreview}
            onPosterCapture={posterHandler}
          />
        ))}
      </section>
      <div ref={sentinelRef} style={{ height: '1px' }} />
      {preview && (
        <Modal open title={preview.title || preview.originalName} onClose={() => setPreview(null)}>
          <video src={preview.streamUrl} controls style={{ width: '100%' }} preload="metadata" />
        </Modal>
      )}
    </div>
  );
};

export default GalleryPage;
