import React, { useMemo } from 'react';
import { useAppStore } from '../store/useStore';

export const Sidebar: React.FC = () => {
  const markers = useAppStore((state) => state.markers);
  const mediaAssets = useAppStore((state) => state.mediaAssets);
  const selectedMarkerId = useAppStore((state) => state.selectedMarkerId);
  const selectMarker = useAppStore((state) => state.selectMarker);
  const searchTerm = useAppStore((state) => state.searchTerm);
  const setSearchTerm = useAppStore((state) => state.setSearchTerm);
  const filter = useAppStore((state) => state.filter);
  const toggleHasMediaFilter = useAppStore((state) => state.toggleHasMediaFilter);

  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      const matchesSearch = marker.name.includes(searchTerm) || marker.description.includes(searchTerm);
      const hasMedia = mediaAssets.some((asset) => asset.markerId === marker.id);
      const matchesMedia = filter.hasMediaOnly ? hasMedia : true;
      return matchesSearch && matchesMedia;
    });
  }, [markers, searchTerm, filter.hasMediaOnly, mediaAssets]);

  const handleFlyToMarker = (markerId: string) => {
    const marker = markers.find((item) => item.id === markerId);
    if (!marker) return;
    window.dispatchEvent(
      new CustomEvent('mars-fly-to-marker', {
        detail: { latitude: marker.latitude, longitude: marker.longitude }
      })
    );
  };

  return (
    <aside className="flex h-full w-full max-w-xs flex-col border-r border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 p-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜索标注名称或描述"
          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={filter.hasMediaOnly}
            onChange={toggleHasMediaFilter}
          />
          仅显示包含媒体的标注
        </label>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          自动线列表
        </h3>
        <div className="flex flex-col gap-2">
          {filteredMarkers.length === 0 && (
            <p className="text-xs text-slate-500">暂无标注或筛选结果为空。</p>
          )}
          {filteredMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`rounded border px-3 py-2 text-sm transition hover:border-sky-500 hover:text-sky-200 ${
                marker.id === selectedMarkerId
                  ? 'border-sky-500 bg-sky-500/10 text-sky-200'
                  : 'border-slate-700 bg-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  className="text-left"
                  onClick={() => selectMarker(marker.id)}
                >
                  <div className="font-semibold">{marker.name}</div>
                  <div className="text-xs text-slate-400">
                    纬度 {marker.latitude.toFixed(2)}° · 经度 {marker.longitude.toFixed(2)}°
                  </div>
                </button>
                <button
                  className="text-xs text-sky-400 hover:text-sky-200"
                  onClick={() => handleFlyToMarker(marker.id)}
                >
                  飞行
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
