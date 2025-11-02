import React from 'react';
import { useParams } from 'react-router-dom';
import ImageCarousel from '../components/shop/ImageCarousel';
import { useCart } from '../components/shop/CartContext';

const productMap = {
  'HX-30A': {
    id: 'HX-30A',
    name: 'HX-30A 智能灌装机',
    price: 128000,
    specs: [
      { label: '适用桶型', value: '1~5L 方桶/圆桶' },
      { label: '灌装精度', value: '±0.1%' },
      { label: '产能', value: '800 桶/小时' },
      { label: '供料方式', value: '自动供料/手动补料' },
    ],
    description: '集成称重、自动补盖、误差校准的旗舰型灌装设备。',
  },
  'HX-30B': {
    id: 'HX-30B',
    name: 'HX-30B 自动线',
    price: 168000,
    specs: [
      { label: '适用桶型', value: '15~25L 铁桶/塑料桶' },
      { label: '码垛方式', value: '机器人码垛' },
      { label: '贴标方式', value: '在线打印贴标' },
      { label: '供料方式', value: '泵送/螺杆增压' },
    ],
    description: '灌装、理盖、压盖、码垛一体化自动生产线。',
  },
} as const;

type ProductId = keyof typeof productMap;

const ProductDetail: React.FC = () => {
  const params = useParams<{ id: ProductId }>();
  const product = params.id ? productMap[params.id] : null;
  const { addItem } = useCart();

  if (!product) {
    return <div className="glass-card p-12 text-center text-white/70">产品不存在</div>;
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <ImageCarousel productId={product.id} total={3} />
      <div className="space-y-6 rounded-3xl bg-white/10 p-8 backdrop-blur-lg">
        <div>
          <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
          <p className="mt-2 text-white/70">{product.description}</p>
        </div>
        <p className="text-4xl font-semibold text-cyan-300">¥{product.price.toLocaleString()}</p>
        <table className="w-full text-left text-white/80">
          <tbody>
            {product.specs.map((spec) => (
              <tr key={spec.label} className="border-b border-white/10">
                <th className="py-3 pr-4 text-sm font-medium text-white/60">{spec.label}</th>
                <td className="py-3 text-sm">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="glass-button w-full" onClick={() => addItem(product)}>
          加入购物车
        </button>
      </div>
    </section>
  );
};

export default ProductDetail;
