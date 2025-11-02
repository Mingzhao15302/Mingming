import { FixedSizeGrid as Grid } from 'react-window';
import { useEffect, useMemo, useRef, useState } from 'react';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: Array<{
    id: number;
    title: string | null;
    metadata: Record<string, unknown>;
    posterUrl: string | null;
    videoUrl: string;
  }>;
  onEdit?: (videoId: number) => void;
  onDelete?: (videoId: number) => void;
}

export default function VideoGrid({ videos, onEdit, onDelete }: VideoGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const columnCount = useMemo(() => {
    if (width >= 1280) return 4;
    if (width >= 900) return 3;
    return 2;
  }, [width]);

  const columnWidth = width / columnCount;
  const rowCount = Math.ceil(videos.length / columnCount);
  const rowHeight = columnWidth * 0.6 + 110;
  const gridHeight = Math.min(rowHeight * rowCount, 900);

  return (
    <div ref={containerRef} className="w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={gridHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
      >
        {({ columnIndex, rowIndex, style }) => {
          const index = rowIndex * columnCount + columnIndex;
          const video = videos[index];
          if (!video) {
            return <div style={style} />;
          }
          return (
            <div style={{ ...style, padding: 12 }}>
              <VideoCard video={video} onEdit={onEdit} onDelete={onDelete} />
            </div>
          );
        }}
      </Grid>
    </div>
  );
}
