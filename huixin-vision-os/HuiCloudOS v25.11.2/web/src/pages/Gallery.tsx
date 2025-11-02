import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../app/store';
import FilterBar, { SelectFilter, ToggleFilterGroup } from '../components/common/FilterBar';
import VideoGrid from '../components/video/VideoGrid';
import PlayerModal from '../components/video/PlayerModal';
import type { VideoItem } from '../components/video/VideoCard';

interface VideoResponse {
  data: Array<VideoItem & { size: number; metadata?: Record<string, unknown>; category?: string }>;
  total: number;
  page: number;
  pageSize: number;
}

const selectFilters: SelectFilter[] = [
  { id: 'productType', label: '产品类型', options: ['灌装机', '自动线', '码垛机'] },
  { id: 'fillerModel', label: '灌装机型号', options: ['30A', '30B/BG', '30G/GY', 'ZSQ', 'HX200', '2T'] },
  { id: 'cap', label: '桶盖', options: ['塑料盖', '花篮盖', '小口桶盖', '圆形铁盖', '内外盖', '偏心口桶盖'] },
  { id: 'capacity', label: '容量', options: ['0.5~5L', '15~25L', '50L', '200L', '1000L'] },
  { id: 'feed', label: '来料方式', options: ['直接供料', '泵送', '过滤', '螺杆增压', '压料机', '拉缸', '角座阀', '手阀控制'] },
  { id: 'explosion', label: '防爆要求', options: ['防爆', '不防爆'] },
  { id: 'fillHeads', label: '灌装方式', options: ['单头', '双头', '三头', '四头', '五头', '六头', '八头'] },
  { id: 'line', label: '灌装自动线', options: ['1~5L方桶灌装自动线', '1~5L圆桶灌装自动线', '15~25L铁桶灌装自动线', '15~25L塑料桶灌装自动线', '15~25L偏心口桶灌装自动线', '50~200L桶灌装自动线', 'IBC桶灌装自动线', '袋式灌装线'] },
  { id: 'capArrange', label: '理盖方式', options: ['自动补盖', '转盘式理盖', '振动盘理盖'] },
  { id: 'capPlace', label: '放盖方式', options: ['单吸盘', '双吸盘', '小口桶自动落盖', '自动追踪放盖', '人工放盖'] },
  { id: 'capPress', label: '压盖方式', options: ['5L平板压', '20L平板压', '花篮压盖', '自动辊压', '自动拧盖', '助力拧盖', '自动封盖', '自动捶盖', '自动封袋', '人工压盖'] },
  { id: 'conveyor', label: '输送方式', options: ['滚筒', '板链', '步进'] },
  { id: 'buffer', label: '缓存方式', options: ['不锈钢面板', '无动力滚筒', '无动力滚筒延长架', '重托盘缓存输送'] },
  { id: 'voc', label: 'VOC要求', options: ['一体式集气', '灌装阀集气'] },
  { id: 'sorting', label: '分桶方式', options: ['卧式分桶', '立式分桶', '抽底式分桶', '理桶平台', '自动卸桶', '人工上空桶'] },
  { id: 'positioning', label: '转桶定位', options: ['滚轮', '八爪鱼', '平板压', '旋压式', '200L滚轮'] },
  { id: 'stacking', label: '码垛方式', options: ['机器人码垛', '悬臂式码垛', '龙门式码垛', '双工位机器人码垛', '双工位悬臂式码垛', '双工位龙门码垛'] },
];

const toggleGroups: ToggleFilterGroup[] = [
  {
    id: 'weighting',
    label: '检重方式',
    options: [
      { id: 'dynamic', label: '动态检重' },
      { id: 'static', label: '静态检重' },
      { id: 'reject', label: '检重剔除' },
    ],
  },
  {
    id: 'labeling',
    label: '贴标方式',
    options: [
      { id: 'empty', label: '空桶贴标' },
      { id: 'full', label: '重桶贴标' },
      { id: 'top', label: '顶部贴标' },
      { id: 'print', label: '在线打印贴标' },
    ],
  },
  {
    id: 'pallet',
    label: '托盘方式',
    options: [
      { id: 'library', label: '托盘库' },
      { id: 'split', label: '托盘分离' },
      { id: 'empty-line', label: '空托盘换线输送' },
      { id: 'full-line', label: '重托盘换线输送' },
    ],
  },
  {
    id: 'packing',
    label: '装箱方式',
    options: [
      { id: 'open', label: '自动开箱' },
      { id: 'pack', label: '自动装箱' },
      { id: 'seal', label: '自动封箱' },
      { id: 'stack', label: '自动码箱' },
    ],
  },
  {
    id: 'extras',
    label: '其他功能',
    options: [
      { id: 'nitrogen', label: '自动充氮' },
      { id: 'bag', label: '自动套内袋' },
      { id: 'belt', label: '皮带输盖' },
      { id: 'code', label: '自动喷码' },
      { id: 'wrap', label: '自动缠绕' },
      { id: 'bind', label: '自动捆扎' },
      { id: 'flip', label: '180°翻桶' },
    ],
  },
];

const Gallery: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});
  const [toggleValues, setToggleValues] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const queryKey = useMemo(
    () => ['videos', page, search, selectValues, toggleValues],
    [page, search, selectValues, toggleValues]
  );

  const { data, isLoading, refetch } = useQuery<VideoResponse>({
    queryKey,
    queryFn: () =>
      apiFetch<VideoResponse>(
        `/videos?page=${page}&pageSize=30&search=${encodeURIComponent(search)}&category=${encodeURIComponent(
          selectValues.productType ?? ''
        )}`
      ),
    keepPreviousData: true,
  });

  useEffect(() => {
    const target = bottomRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && data && data.total > page * data.pageSize) {
        queryClient.prefetchQuery({
          queryKey: ['videos', page + 1, search, selectValues, toggleValues],
          queryFn: () =>
            apiFetch<VideoResponse>(
              `/videos?page=${page + 1}&pageSize=30&search=${encodeURIComponent(search)}&category=${encodeURIComponent(
                selectValues.productType ?? ''
              )}`
            ),
        });
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [data, page, search, selectValues, toggleValues, queryClient]);

  const items = data?.data ?? [];
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const meta = typeof (item as any).metadata === 'string' ? JSON.parse((item as any).metadata) : (item as any).metadata ?? {};
      const selectMatch = Object.entries(selectValues).every(([key, value]) => {
        if (!value) return true;
        if (key === 'productType') {
          return item.category === value || meta[key] === value;
        }
        return meta?.[key] === value;
      });
      if (!selectMatch) return false;
      return Object.entries(toggleValues).every(([group, values]) => {
        if (!values?.length) return true;
        const metaValues = Array.isArray(meta?.[group]) ? (meta?.[group] as string[]) : [];
        return values.every((value) => metaValues.includes(value));
      });
    });
  }, [items, selectValues, toggleValues]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold text-white">视频浏览</h2>
        <div className="flex items-center gap-3">
          <input
            className="glass-input w-64"
            placeholder="搜索视频/分类关键词"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <button type="button" className="glass-button" onClick={() => refetch()}>
            搜索
          </button>
        </div>
      </div>
      <FilterBar
        selectFilters={selectFilters}
        toggleGroups={toggleGroups}
        selectValues={selectValues}
        toggleValues={toggleValues}
        expanded={expanded}
        onToggleExpand={() => setExpanded((value) => !value)}
        onSelectChange={(id, value) => {
          setSelectValues((prev) => ({ ...prev, [id]: value }));
          setPage(1);
        }}
        onToggleChange={(group, option) => {
          setToggleValues((prev) => {
            const current = new Set(prev[group] ?? []);
            if (current.has(option)) {
              current.delete(option);
            } else {
              current.add(option);
            }
            return { ...prev, [group]: Array.from(current) };
          });
        }}
      />
      {isLoading ? (
        <div className="glass-card p-12 text-center text-white/70">加载中...</div>
      ) : (
        <VideoGrid items={filteredItems} onOpen={setSelectedVideo} />
      )}
      <div className="mt-6 flex items-center justify-between text-sm text-white/70">
        <span>
          共 {data?.total ?? 0} 条记录 · 第 {data?.page ?? 1}/{Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 30)))} 页
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            className="glass-button bg-white/10"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            上一页
          </button>
          <button
            type="button"
            className="glass-button bg-white/10"
            disabled={!data || data.page * data.pageSize >= data.total}
            onClick={() => setPage((value) => value + 1)}
          >
            下一页
          </button>
        </div>
      </div>
      <div ref={bottomRef} className="h-1" />
      <PlayerModal item={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </section>
  );
};

export default Gallery;
