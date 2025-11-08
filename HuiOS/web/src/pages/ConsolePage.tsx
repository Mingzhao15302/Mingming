import { ChangeEvent, useEffect, useState } from 'react'
import TabSwitcher from '../components/TabSwitcher'
import { fetchJSON, postJSON, uploadFormData } from '../utils/api'

const useAsyncAction = () => {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    try {
      const feedback = await action()
      setMessage(feedback)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return { message, busy, run }
}

const ConsolePage = () => {
  const [activeTab, setActiveTab] = useState('videos')
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const uploadAction = useAsyncAction()
  const csvAction = useAsyncAction()
  const [indexingMessage, setIndexingMessage] = useState('')

  const handleVideoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) {
      uploadAction.run(async () => '文件超过 100MB 限制')
      return
    }
    uploadAction.run(async () => {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('title', file.name)
      await uploadFormData('/api/videos/upload', formData)
      return '上传成功，索引将自动更新'
    })
  }

  const handleCsvSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return
      const worker = new Worker(new URL('../workers/csvParser.ts', import.meta.url), {
        type: 'module'
      })
      worker.postMessage({ text: reader.result })
      worker.onmessage = (message) => {
        setCsvPreview(message.data.rows)
        worker.terminate()
      }
    }
    reader.readAsText(file)
  }

  const handleCsvExport = () => {
    if (csvPreview.length === 0) {
      csvAction.run(async () => '请选择 CSV 数据后再导出')
      return
    }
    csvAction.run(async () => {
      const response = await postJSON<{ path: string }>('/api/csv/export', {
        data: csvPreview,
        filename: `export-${Date.now()}.csv`
      })
      return `CSV 已导出至 ${response.path}`
    })
  }

  const tabs = [
    {
      key: 'videos',
      label: '视频库',
      content: (
        <div className="space-y-4">
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-lg text-white/80">上传视频</h3>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white"
            />
            <p className="text-sm text-white/60">单个文件≤100MB，将自动生成首帧图并索引。</p>
            {uploadAction.message && <p className="text-sm text-cyan-200">{uploadAction.message}</p>}
          </div>
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-lg text-white/80">CSV 导入与预览</h3>
            <input type="file" accept=".csv" onChange={handleCsvSelect} className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white" />
            <div className="max-h-60 overflow-y-auto border border-white/10 rounded-2xl p-4 space-y-2">
              {csvPreview.length === 0 ? (
                <p className="text-sm text-white/60">暂无数据</p>
              ) : (
                csvPreview.slice(0, 10).map((row, index) => (
                  <pre key={index} className="text-xs text-white/70 whitespace-pre-wrap">
                    {JSON.stringify(row, null, 2)}
                  </pre>
                ))
              )}
            </div>
            <button className="glass-button" onClick={handleCsvExport} disabled={csvAction.busy}>
              导出 UTF-8 CSV
            </button>
            {csvAction.message && <p className="text-sm text-cyan-200">{csvAction.message}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'quotes',
      label: '报价',
      content: <PlaceholderPanel title="报价管理" description="配置模板、优惠策略并生成报价单 PDF。" />
    },
    {
      key: 'orders',
      label: '订单',
      content: <PlaceholderPanel title="订单中心" description="查看订单、导出合同与物流状态。" />
    },
    {
      key: 'products',
      label: '商品',
      content: <PlaceholderPanel title="商品管理" description="批量导入图片、维护产品参数并同步商城。" />
    },
    {
      key: 'contracts',
      label: '合同',
      content: <PlaceholderPanel title="合同模板" description="上传合同模板，支持打印与 PDF 导出。" />
    },
    {
      key: 'settings',
      label: '设置',
      content: <SettingsPanel />
    }
  ]

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white/90">控制台</h2>
          <p className="text-white/70">通过标签页切换管理后台业务。</p>
          {indexingMessage && <p className="text-sm text-cyan-200 mt-2">{indexingMessage}</p>}
        </div>
        <button
          className="glass-button"
          onClick={() => {
            setIndexingMessage('索引中...')
            fetchJSON<{ total: number }>('/api/index/rescan')
              .then((data) => {
                setIndexingMessage(`索引完成，共 ${data.total} 条视频`)
              })
              .catch(() => setIndexingMessage('索引失败，请稍后再试'))
          }}
        >
          一键重扫索引
        </button>
      </header>
      <TabSwitcher active={activeTab} onChange={setActiveTab} tabs={tabs} />
    </section>
  )
}

const PlaceholderPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-3">
    <h3 className="text-xl text-white/80">{title}</h3>
    <p className="text-white/60">{description}</p>
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass-card p-4 space-y-2">
          <div className="h-32 rounded-2xl bg-white/10 border border-white/10" />
          <div className="text-white/70 text-sm">功能占位 {index + 1}</div>
        </div>
      ))}
    </div>
  </div>
)

const SettingsPanel = () => {
  const [config, setConfig] = useState({
    company: '',
    salesperson: '',
    notes: ''
  })
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchJSON<Record<string, string>>('/api/settings')
      .then((data) => {
        setConfig((prev) => ({
          ...prev,
          ...data
        }))
      })
      .catch(() => {
        setFeedback('无法获取已有配置')
      })
  }, [])

  const handleSubmit = async () => {
    const response = await postJSON<{ saved: boolean }>('/api/settings', config)
    if (response.saved) {
      setFeedback('配置已保存')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-white/70">公司名称</label>
          <input
            value={config.company}
            onChange={(event) => setConfig((prev) => ({ ...prev, company: event.target.value }))}
            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">业务员名单</label>
          <input
            value={config.salesperson}
            onChange={(event) => setConfig((prev) => ({ ...prev, salesperson: event.target.value }))}
            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
            placeholder="使用逗号分隔"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/70">客户记录</label>
        <textarea
          value={config.notes}
          onChange={(event) => setConfig((prev) => ({ ...prev, notes: event.target.value }))}
          className="w-full min-h-[140px] rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
        />
      </div>
      <button className="glass-button" onClick={handleSubmit}>
        保存设置
      </button>
      {feedback && <div className="text-sm text-cyan-200">{feedback}</div>}
    </div>
  )
}

export default ConsolePage
