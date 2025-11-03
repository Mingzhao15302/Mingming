import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VideoCard } from '../components/VideoCard';
import { VideoModal } from '../components/VideoModal';
import { VideoFilterBar } from '../components/VideoFilterBar';
import { api } from '../app/api';
import { VideoItem } from '../app/AppContext';

interface PageResponse {
  items: VideoItem[];
  page: number;
  pages: number;
  total: number;
}

export function GalleryPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useMemo(() => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params[key] = value.join('|');
      } else if (typeof value === 'string' && value) {
        params[key] = value;
      }
    });
    return params;
  }, [filters]);

  const loadPage = useCallback(
    async (targetPage: number, replace = false) => {
      setLoading(true);
      try {
        const response = (await api.fetchVideos({ ...query, page: targetPage, pageSize: 30 })) as PageResponse;
        const nextItems = response.items ?? [];
        setPage(response.page);
        setHasMore(response.page < response.pages);
        setVideos((prev) => (replace ? nextItems : [...prev, ...nextItems]));
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    setVideos([]);
    loadPage(1, true);
  }, [loadPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadPage(page + 1);
        }
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadPage]);

  function handleFiltersChange(nextFilters: Record<string, string | string[]>) {
    setFilters(nextFilters);
  }

  return (
    <section style={{ display: 'grid', gap: '1.5rem' }}>
      <VideoFilterBar onChange={handleFiltersChange} />
      <div className="grid-responsive">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            item={video}
            onEdit={() => setSelected(video)}
            onDelete={() => setSelected(video)}
            onPlay={() => setSelected(video)}
          />
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: '1px' }} />
      {loading && <div style={{ textAlign: 'center', color: 'rgba(15,23,42,0.6)' }}>加载中...</div>}
      {!loading && videos.length === 0 && <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>暂无视频，请前往控制台上传。</div>}
      <VideoModal video={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
