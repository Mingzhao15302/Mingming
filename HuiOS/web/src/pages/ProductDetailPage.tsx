import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()

  const product = useMemo(
    () => ({
      id,
      name: '工业视觉智能终端',
      model: id ?? 'HX-2024',
      price: 5680,
      description: '支持多协议接入、AI 算法推理，快速搭建本地化业务中台。',
      specs: [
        '八核处理器，24GB 统一内存',
        '四路 4K 视频解码与实时转码',
        '本地加密存储，零信任访问控制',
        '支持局域网与 5G 模块扩展'
      ]
    }),
    [id]
  )

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6 space-y-4">
          <div className="aspect-video rounded-2xl bg-white/10 border border-white/20" />
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 w-24 rounded-xl bg-white/10 border border-white/20" />
            ))}
          </div>
        </div>
        <div className="glass-card p-8 space-y-5">
          <div>
            <h2 className="text-3xl font-semibold text-white/90">{product.name}</h2>
            <p className="text-white/70">型号：{product.model}</p>
          </div>
          <div>
            <h3 className="text-lg text-white/80 mb-2">技术参数</h3>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              {product.specs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="text-3xl font-bold text-cyan-200">¥{product.price.toLocaleString()}</div>
          <div className="flex flex-wrap gap-3">
            <Link to="/cart" state={{ product }} className="glass-button px-6 py-3 text-lg">
              加入购物车
            </Link>
            <Link to="/checkout" state={{ product }} className="glass-button px-6 py-3 text-lg">
              立即结算
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductDetailPage
