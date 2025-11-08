import { FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

const CheckoutPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const items = (location.state as { items?: CartItem[] })?.items ?? []
  const [form, setForm] = useState({
    customer: '',
    contact: '',
    phone: '',
    salesperson: ''
  })

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate('/order-success', { state: { form, items, total } })
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold text-white/90">订单结算</h2>
        <div className="flex gap-3">
          <Link to="/cart" className="glass-button">
            返回购物车
          </Link>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-white/70 mb-2">客户名称</label>
            <input
              value={form.customer}
              onChange={(event) => setForm((prev) => ({ ...prev, customer: event.target.value }))}
              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">联系人</label>
            <input
              value={form.contact}
              onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">联系电话</label>
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">业务员</label>
            <input
              value={form.salesperson}
              onChange={(event) => setForm((prev) => ({ ...prev, salesperson: event.target.value }))}
              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
            />
          </div>
        </div>
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xl text-white/80">订单汇总</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-white/80">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>¥{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-lg font-semibold text-cyan-200">
            <span>合计</span>
            <span>¥{total.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Link to="/cart" className="glass-button">
            返回购物车
          </Link>
          <button type="submit" className="glass-button px-6 py-3 text-lg">
            提交订单
          </button>
        </div>
      </form>
    </section>
  )
}

export default CheckoutPage
