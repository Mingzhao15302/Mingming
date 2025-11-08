import { useEffect, useRef, useState } from 'react'

export interface VideoItem {
  id: string
  title: string
  description?: string
  src: string
  poster?: string
  duration?: number
  size?: number
}

interface VideoCardProps {
  video: VideoItem
  onCapturePoster: (id: string, blob: Blob) => Promise<void>
}

const VideoCard = ({ video, onCapturePoster }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const [volume, setVolume] = useState(0.4)

  useEffect(() => {
    const element = videoRef.current
    if (!element) return

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(entry.isIntersecting)
          if (entry.isIntersecting && element.readyState >= 2 && !video.poster) {
            capturePoster()
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.current.observe(element)

    return () => {
      observer.current?.disconnect()
    }
  }, [video.poster])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = volume === 0
    }
  }, [volume])

  const capturePoster = async () => {
    const element = videoRef.current
    if (!element) return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = element.videoWidth
      canvas.height = element.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(element, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'))
      if (blob) {
        await onCapturePoster(video.id, blob)
      }
    } catch (error) {
      console.error('Failed to capture poster', error)
    }
  }

  return (
    <div className="glass-card p-4 space-y-3 hover:shadow-glow transition-all duration-200">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/20">
        <video
          ref={videoRef}
          src={isIntersecting ? video.src : undefined}
          poster={video.poster}
          preload="metadata"
          playsInline
          muted
          className="h-full w-full object-cover"
          onLoadedData={() => {
            if (isIntersecting && !video.poster) {
              void capturePoster()
            }
          }}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs">
          <button className="glass-button !px-3 !py-1" onClick={() => videoRef.current?.play()}>
            播放
          </button>
          <button className="glass-button !px-3 !py-1" onClick={() => videoRef.current?.pause()}>
            暂停
          </button>
          <label className="flex items-center gap-1 text-white/80">
            <span>音量</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => {
                const value = Number(event.target.value)
                setVolume(value)
                if (videoRef.current) {
                  videoRef.current.muted = value === 0
                  videoRef.current.volume = value
                }
              }}
            />
          </label>
          <button className="glass-button !px-3 !py-1" onClick={() => videoRef.current?.requestFullscreen?.()}>
            全屏
          </button>
          <a className="glass-button !px-3 !py-1" href={video.src} download>
            下载
          </a>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white/90">{video.title}</h3>
        {video.description && <p className="text-sm text-white/70 line-clamp-2">{video.description}</p>}
      </div>
    </div>
  )
}

export default VideoCard
