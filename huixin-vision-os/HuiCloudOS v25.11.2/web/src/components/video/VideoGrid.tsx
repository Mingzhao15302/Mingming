import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import VideoCard, { VideoItem } from './VideoCard';

interface VideoGridProps {
  items: VideoItem[];
  onOpen?: (item: VideoItem) => void;
}

const GAP = 24;

const VideoGrid: React.FC<VideoGridProps> = ({ items, onOpen }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          setWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const columns = useMemo(() => {
    if (width > 1100) return 4;
    if (width > 768) return 3;
    return 2;
  }, [width]);

  const cardWidth = (width - GAP * (columns - 1)) / columns;
  const cardHeight = (cardWidth * 9) / 16 + 120;
  const rowCount = Math.ceil(items.length / columns);
  const listHeight = rowCount === 0 ? 200 : Math.min(900, rowCount * cardHeight);

  const Row = ({ index, style }: ListChildComponentProps) => {
    const start = index * columns;
    const rowItems = items.slice(start, start + columns);
    return (
      <div style={{ ...style, width }} className="flex gap-6">
        {rowItems.map((item) => (
          <div key={item.filename} style={{ width: cardWidth }}>
            <VideoCard item={item} onOpen={onOpen} />
          </div>
        ))}
        {rowItems.length < columns &&
          Array.from({ length: columns - rowItems.length }).map((_, fillerIndex) => (
            <div key={`filler-${fillerIndex}`} style={{ width: cardWidth }} />
          ))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-[900px] w-full">
      <List height={listHeight} itemCount={rowCount} itemSize={cardHeight} width={width} className="space-y-6">
        {Row}
      </List>
    </div>
  );
};

export default VideoGrid;
