import { useCallback, useEffect, useState } from 'react'
import { fetchJSON, uploadFormData } from '../utils/api'
import type { VideoItem } from '../components/VideoCard'

interface VideoFilter {
  keyword?: string
}

export const useVideoLibrary = () => {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [filtered, setFiltered] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadVideos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchJSON<VideoItem[]>('/api/videos')
      setVideos(data)
      setFiltered(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVideos()
  }, [loadVideos])

  const filterVideos = useCallback(
    ({ keyword }: VideoFilter) => {
      if (!keyword) {
        setFiltered(videos)
        return
      }
      const normalized = keyword.toLowerCase()
      setFiltered(videos.filter((video) => video.title.toLowerCase().includes(normalized)))
    },
    [videos]
  )

  const updatePoster = useCallback(
    async (id: string, blob: Blob) => {
      const form = new FormData()
      form.append('poster', blob, `${id}.jpg`)
      form.append('id', id)
      const updated = await uploadFormData<VideoItem>('/api/videos/poster', form)
      setVideos((prev) => prev.map((video) => (video.id === id ? updated : video)))
      setFiltered((prev) => prev.map((video) => (video.id === id ? updated : video)))
    },
    []
  )

  return { videos: filtered, loading, reload: loadVideos, filterVideos, updatePoster }
}
