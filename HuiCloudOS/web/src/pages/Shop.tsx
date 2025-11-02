import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AppShell from '../components/layout/AppShell';
import ProductCard from '../components/shop/ProductCard';
import FloatingCartButton from '../components/shop/FloatingCartButton';
import { addToCart, getCart } from '../app/cart';

interface ProductRecord {
  id: number;
  productId: string;
  name: string;
  price: number;
  description?: string;
}

export default function Shop() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await axios.get('/api/products', { params: { page: 1, pageSize: 30 } });
      return response.data as { data: ProductRecord[] };
    }
  });
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  const handleAdd = (product: ProductRecord) => {
    const updated = addToCart({ productId: product.productId, name: product.name, price: product.price, quantity: 1 });
    setCartCount(updated.reduce((sum, item) => sum + item.quantity, 0));
  };

  return (
    <AppShell>
      <section className="space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-white/10 p-8 shadow-lg">
          <h2 className="text-3xl font-semibold text-white">辉云易达智慧商城</h2>
          <p className="text-slate-300">
            精选灌装生产线、码垛方案与自动化部件，支持在线比价、报价与下单。
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data?.data.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              onAddToCart={() => handleAdd(product)}
              onOpenDetail={(productId) => navigate(`/shop/${productId}`)}
            />
          ))}
        </div>
      </section>
      <FloatingCartButton itemCount={cartCount} />
    </AppShell>
  );
}
