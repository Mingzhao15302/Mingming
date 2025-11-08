import { useEffect, useRef, useState } from 'react'
import VideoCard, { type VideoItem } from './VideoCard'

interface VirtualVideoGridProps {
  videos: VideoItem[]
  onCapturePoster: (id: string, blob: Blob) => Promise<void>
  columnCount?: number
  batchSize?: number
}

const VirtualVideoGrid = ({ videos, onCapturePoster, columnCount = 3, batchSize = 40 }: VirtualVideoGridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const [columns, setColumns] = useState(() => calculateColumns(columnCount))

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current
      if (!el) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        setVisibleCount((count) => Math.min(videos.length, count + batchSize))
      }
    }
    const el = containerRef.current
    el?.addEventListener('scroll', handleScroll)
    return () => el?.removeEventListener('scroll', handleScroll)
  }, [videos.length, batchSize])

  useEffect(() => {
    setVisibleCount(batchSize)
  }, [videos, batchSize])

  useEffect(() => {
    const updateColumns = () => setColumns(calculateColumns(columnCount))
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [columnCount])

  return (
    <div ref={containerRef} className="h-[70vh] overflow-y-auto pr-2">
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
        }}
      >
        {videos.slice(0, visibleCount).map((video) => (
          <VideoCard key={video.id} video={video} onCapturePoster={onCapturePoster} />
        ))}
      </div>
      {visibleCount < videos.length && (
        <div className="mt-6 text-center text-white/70">加载中... ({visibleCount}/{videos.length})</div>
      )}
    </div>
  )
}

export default VirtualVideoGrid

const calculateColumns = (preferred: number) => {
  if (typeof window === 'undefined') return preferred
  if (window.innerWidth < 640) return 1
  if (window.innerWidth < 1024) return Math.min(2, preferred)
  if (window.innerWidth < 1440) return Math.min(3, preferred)
  return preferred
}
