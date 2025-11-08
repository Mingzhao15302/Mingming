import { useLocation, useNavigate } from 'react-router-dom'

const OrderSuccessPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { form, items, total } = (location.state as Record<string, unknown>) ?? {}

  const handlePrint = () => {
    window.print()
  }

  const handleExport = (type: 'order' | 'contract') => {
    console.log('Export PDF', type, { form, items, total })
  }

  return (
    <section className="space-y-6">
      <div className="glass-card p-8 space-y-4 text-center">
        <h2 className="text-3xl font-semibold text-white/90">下单成功</h2>
        <p className="text-white/70">
          我们已收到订单，稍后将由业务人员与您联系。您可以导出 PDF 或继续浏览商城。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="glass-button px-6 py-3 text-lg" onClick={() => navigate(-1)}>
            返回
          </button>
          <button className="glass-button px-6 py-3 text-lg" onClick={handlePrint}>
            打印订单
          </button>
          <button className="glass-button px-6 py-3 text-lg" onClick={() => handleExport('order')}>
            导出订单 PDF
          </button>
          <button className="glass-button px-6 py-3 text-lg" onClick={() => handleExport('contract')}>
            导出合同 PDF
          </button>
        </div>
      </div>
    </section>
  )
}

export default OrderSuccessPage
