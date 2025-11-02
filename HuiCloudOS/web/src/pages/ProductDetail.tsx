import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AppShell from '../components/layout/AppShell';
import ImageCarousel from '../components/shop/ImageCarousel';
import Button from '../components/common/Button';
import { addToCart } from '../app/cart';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { data } = useQuery({
    queryKey: ['product', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const response = await axios.get(`/api/products/${productId}`);
      return response.data as {
        productId: string;
        name: string;
        description: string;
        price: number;
        specs: Record<string, string>;
      };
    }
  });

  const specs = useMemo(() => Object.entries(data?.specs ?? {}), [data?.specs]);

  if (!productId) {
    return null;
  }

  return (
    <AppShell>
      <section className="grid gap-10 lg:grid-cols-2">
        <ImageCarousel productId={productId} count={data?.images?.length ?? 3} />
        <div className="glass-card space-y-6 p-8">
          <div>
            <h2 className="text-3xl font-semibold text-white">{data?.name}</h2>
            <p className="text-slate-300">{data?.description ?? '多场景灌装解决方案'}</p>
          </div>
          <div className="text-2xl font-bold text-sky-200">¥{data?.price.toFixed(2)}</div>
          <Button
            onClick={() =>
              data &&
              addToCart({ productId: data.productId, name: data.name, price: data.price, quantity: 1 })
            }
            className="px-6 py-3 text-base"
          >
            加入购物车
          </Button>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">技术参数</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {specs.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-white/10 p-4 text-sm text-slate-100">
                  <span className="block text-slate-400">{key}</span>
                  <span className="font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
