import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AppShell from '../components/layout/AppShell';
import FilterBar, { FiltersState } from '../components/common/FilterBar';
import VideoGrid from '../components/video/VideoGrid';
import PlayerModal from '../components/video/PlayerModal';

interface VideoRecord {
  id: number;
  title: string | null;
  metadata: Record<string, unknown>;
  posterUrl: string | null;
  videoUrl: string;
}

export default function Gallery() {
  const [filters, setFilters] = useState<FiltersState>({ productType: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalSrc, setModalSrc] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['videos', page, filters, search],
    queryFn: async () => {
      const response = await axios.get('/api/videos', {
        params: {
          page,
          pageSize: 30,
          search
        }
      });
      return response.data as { data: VideoRecord[]; total: number; page: number; pageSize: number };
    }
  });

  const videos = useMemo(() => {
    if (!data) return [] as VideoRecord[];
    return data.data.filter((video) => {
      const matchesSearch = search
        ? (video.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (video.metadata?.model as string | undefined)?.toLowerCase().includes(search.toLowerCase())
        : true;
      const productType = (filters.productType as string) || '';
      const matchesProductType = productType ? video.metadata?.productType === productType : true;
      return matchesSearch && matchesProductType;
    });
  }, [data, filters, search]);

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="glass-card flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold text-white">视频库</h2>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="搜索型号或标题"
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>
          <p className="text-sm text-slate-300">
            支持悬浮播放控制、批量筛选与懒加载，虚拟滚动确保大规模视频列表仍然流畅。
          </p>
        </div>
        <FilterBar filters={filters} onChange={(next) => setFilters(next)} />
        {isLoading ? (
          <div className="rounded-3xl bg-white/5 p-10 text-center text-slate-200">加载中...</div>
        ) : (
          <VideoGrid
            videos={videos.map((video) => ({
              ...video,
              metadata: video.metadata ?? {}
            }))}
            onEdit={(id) => setModalSrc(videos.find((item) => item.id === id)?.videoUrl)}
            onDelete={() => undefined}
          />
        )}
        <div className="text-center text-sm text-slate-300">
          共 {data?.total ?? 0} 条数据 · 当前第 {page} 页
          <div className="mt-3 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full bg-white/10 px-4 py-2 text-slate-100 hover:bg-white/20"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-full bg-white/10 px-4 py-2 text-slate-100 hover:bg-white/20"
            >
              下一页
            </button>
          </div>
        </div>
      </section>
      <PlayerModal open={Boolean(modalSrc)} src={modalSrc} onClose={() => setModalSrc(undefined)} />
    </AppShell>
  );
}
