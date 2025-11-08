import { useMemo, useState } from 'react'
import VirtualVideoGrid from '../components/VirtualVideoGrid'
import { useVideoLibrary } from '../hooks/useVideoLibrary'

const VideoBrowserPage = () => {
  const { videos, loading, filterVideos, updatePoster } = useVideoLibrary()
  const [keyword, setKeyword] = useState('')
  const [advancedVisible, setAdvancedVisible] = useState(false)

  const summary = useMemo(() => ({ total: videos.length }), [videos])

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white/90">视频浏览</h2>
          <p className="text-white/70">共索引 {summary.total} 条视频</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              filterVideos({ keyword: event.target.value })
            }}
            className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
            placeholder="搜索视频标题"
          />
          <button className="glass-button" onClick={() => setAdvancedVisible((v) => !v)}>
            {advancedVisible ? '收起筛选' : '展开筛选'}
          </button>
        </div>
      </div>
      {advancedVisible && (
        <div className="glass-card p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm text-white/70 mb-2">分类</label>
            <div className="flex flex-wrap gap-2">
              {['全部', '宣传片', '案例', '教程'].map((item) => (
                <button key={item} className="glass-button">
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">时长</label>
            <div className="flex gap-2">
              <button className="glass-button">短</button>
              <button className="glass-button">中</button>
              <button className="glass-button">长</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="glass-card p-6 text-center text-white/80">加载中...</div>
      ) : (
        <VirtualVideoGrid videos={videos} onCapturePoster={updatePoster} />
      )}
    </section>
  )
}

export default VideoBrowserPage
