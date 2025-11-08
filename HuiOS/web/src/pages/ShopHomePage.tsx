import { Link } from 'react-router-dom'

const placeholderProducts = Array.from({ length: 8 }).map((_, index) => ({
  id: `product-${index + 1}`,
  name: `设备型号 ${index + 1}`,
  price: 3999 + index * 200,
  summary: '液态玻璃质感设备，支持多场景部署'
}))

const ShopHomePage = () => {
  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white/90">商城首页</h2>
          <p className="text-white/70">精选智能硬件，快速部署业务中台。</p>
        </div>
        <Link to="/cart" className="glass-button">
          查看购物车
        </Link>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {placeholderProducts.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`} className="glass-card p-6 space-y-4 hover:shadow-glow">
            <div className="aspect-video rounded-2xl bg-white/10 border border-white/20" />
            <div>
              <h3 className="text-xl font-semibold text-white/90">{product.name}</h3>
              <p className="text-sm text-white/70">{product.summary}</p>
            </div>
            <div className="text-2xl font-bold text-cyan-200">¥{product.price.toLocaleString()}</div>
          </Link>
        ))}
      </div>
      <button className="fixed bottom-6 right-6 glass-button shadow-glow px-6 py-3 text-lg">购物车</button>
    </section>
  )
}

export default ShopHomePage
