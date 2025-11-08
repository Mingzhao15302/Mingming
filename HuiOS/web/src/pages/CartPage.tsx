import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

const CartPage = () => {
  const location = useLocation()
  const initialProduct = (location.state as { product?: CartItem })?.product
  const [items, setItems] = useState<CartItem[]>(
    initialProduct ? [{ ...initialProduct, quantity: 1 }] : []
  )

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white/90">购物车</h2>
          <p className="text-white/70">管理待结算的设备与服务。</p>
        </div>
        <div className="flex gap-3">
          <Link to="/shop" className="glass-button">
            返回商城
          </Link>
          <Link to="/checkout" state={{ items }} className="glass-button">
            去结算
          </Link>
        </div>
      </header>
      <div className="glass-card divide-y divide-white/20">
        {items.length === 0 ? (
          <div className="p-6 text-white/70 text-center">购物车为空</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-28 rounded-xl bg-white/10 border border-white/20" />
                <div>
                  <h3 className="text-lg font-semibold text-white/90">{item.name}</h3>
                  <div className="text-sm text-white/60">单价：¥{item.price.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="glass-button !px-3" onClick={() => updateQuantity(item.id, -1)}>
                  -
                </button>
                <span className="text-lg text-white/90">{item.quantity}</span>
                <button className="glass-button !px-3" onClick={() => updateQuantity(item.id, 1)}>
                  +
                </button>
              </div>
              <div className="text-xl font-semibold text-cyan-200">
                ¥{(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="glass-card p-6 flex items-center justify-between">
        <span className="text-white/80">合计</span>
        <span className="text-2xl font-bold text-cyan-200">¥{total.toLocaleString()}</span>
      </div>
    </section>
  )
}

export default CartPage
