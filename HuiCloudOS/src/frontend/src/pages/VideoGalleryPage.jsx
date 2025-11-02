import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoCard from '../components/VideoCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { FILTER_FIELDS, MULTI_FIELDS, PRODUCT_TYPES } from '../utils/constants.js';
import DropdownField from '../components/fields/DropdownField.jsx';
import MultiSelectField from '../components/fields/MultiSelectField.jsx';
import VideoMetaModal from '../components/VideoMetaModal.jsx';

const PAGE_SIZE = 30;

export default function VideoGalleryPage() {
  const { api, videoFilters, setVideoFilters } = useAppContext();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const filtersToQuery = useCallback((filters) => encodeURIComponent(JSON.stringify(filters)), []);

  const loadVideos = useCallback(
    async (targetPage, reset = false) => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(targetPage));
        searchParams.set('pageSize', String(PAGE_SIZE));
        if (videoFilters.search) {
          searchParams.set('search', videoFilters.search);
        }
        searchParams.set('filters', filtersToQuery(videoFilters.categories || {}));
        const result = await api.get(`/api/videos?${searchParams.toString()}`);
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
        setHasMore(result.items.length === PAGE_SIZE);
        setPage(result.page);
      } catch (error) {
        console.error('加载视频失败', error);
      } finally {
        setLoading(false);
      }
    },
    [api, filtersToQuery, videoFilters]
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadVideos(1, true);
  }, [videoFilters, loadVideos]);

  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadVideos(page + 1);
        }
      });
    }, { rootMargin: '200px' });
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [hasMore, loading, loadVideos, page]);

  const currentType = videoFilters.categories?.产品类型;

  const dropdownFields = useMemo(() => {
    if (currentType === '灌装机') {
      return [
        '灌装机型号',
        '桶盖',
        '容量',
        '来料方式',
        '防爆要求',
        '灌装方式',
        '放盖方式',
        '压盖方式',
        '输送方式',
        '缓存方式',
        'VOC要求'
      ];
    }
    if (currentType === '自动线') {
      return [
        '灌装自动线',
        '桶盖',
        '容量',
        '来料方式',
        '防爆要求',
        '分桶方式',
        '灌装方式',
        '理盖方式',
        '放盖方式',
        '压盖方式',
        '输送方式',
        '缓存方式',
        'VOC要求',
        '码垛方式'
      ];
    }
    if (currentType === '码垛机') {
      return ['桶盖', '容量', '防爆要求', '码垛方式'];
    }
    return [];
  }, [currentType]);

  const multiFields = useMemo(() => {
    if (currentType === '自动线') {
      return ['检重方式', '贴标方式', '托盘方式', '装箱方式', '其他功能'];
    }
    return [];
  }, [currentType]);

  const handleCategoryChange = (key, value) => {
    setVideoFilters((prev) => ({
      ...prev,
      categories: {
        ...(prev.categories || {}),
        [key]: value
      }
    }));
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      <header style={{ display: 'grid', gap: '0.6rem' }}>
        <h2 className="section-title">视频浏览</h2>
        <p className="section-subtitle">通过多维筛选快速定位目标演示视频，IntersectionObserver 实现懒加载。</p>
      </header>
      <div className="hc-card" style={{ padding: '1.5rem 1.8rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              style={{ flex: '1 1 240px' }}
              placeholder="搜索文件名 / 标题"
              value={videoFilters.search || ''}
              onChange={(event) => setVideoFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
            <DropdownField
              label="产品类型"
              options={PRODUCT_TYPES}
              value={videoFilters.categories?.产品类型}
              onChange={(value) => handleCategoryChange('产品类型', value)}
            />
            <button type="button" onClick={() => setExpanded((v) => !v)} style={{ width: '160px' }}>
              {expanded ? '收起筛选' : '展开筛选'}
            </button>
          </div>
          <div
            style={{
              display: expanded ? 'flex' : 'grid',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            {(expanded ? dropdownFields : dropdownFields.slice(0, 4)).map((field) => (
              <DropdownField
                key={field}
                label={field}
                options={FILTER_FIELDS[field] || []}
                value={videoFilters.categories?.[field]}
                onChange={(value) => handleCategoryChange(field, value)}
              />
            ))}
          </div>
          {expanded &&
            multiFields.map((field) => (
              <MultiSelectField
                key={field}
                label={field}
                options={MULTI_FIELDS[field] || []}
                values={videoFilters.categories?.[field] || []}
                onChange={(value) => handleCategoryChange(field, value)}
              />
            ))}
        </div>
      </div>
      <div className="grid-responsive">
        {items.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onEdit={(item) => setEditVideo(item)}
            onPlay={() => {}}
          />
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: '1px' }} />
      {loading && <div style={{ textAlign: 'center', opacity: 0.75 }}>加载中...</div>}
      {!hasMore && !loading && <div style={{ textAlign: 'center', opacity: 0.65 }}>已到达列表底部</div>}
      {editVideo && !editVideo.previewOnly && (
        <VideoMetaModal
          video={editVideo}
          onClose={() => setEditVideo(null)}
          onSave={async (payload) => {
            await api.put(`/api/videos/${editVideo.id}`, payload);
            setEditVideo(null);
            loadVideos(1, true);
          }}
        />
      )}
    </section>
  );
}
