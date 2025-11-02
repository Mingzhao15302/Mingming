import React from 'react';
import ProductCard from '../components/shop/ProductCard';
import FloatingCartButton from '../components/shop/FloatingCartButton';

const products = [
  {
    id: 'HX-30A',
    name: 'HX-30A 智能灌装机',
    price: 128000,
    description: '支持多规格桶型，自动称重防滴漏',
    image: '/products/HX-30A/card.jpg',
  },
  {
    id: 'HX-30B',
    name: 'HX-30B 自动线',
    price: 168000,
    description: '双工位自动线，含码垛与贴标模块',
    image: '/products/HX-30B/card.jpg',
  },
];

const Shop: React.FC = () => {
  return (
    <section className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">商城精选</h2>
          <p className="text-white/60">自动线、灌装机、码垛机等核心产品一站式选购</p>
        </div>
        <input className="glass-input w-64" placeholder="搜索产品" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <FloatingCartButton />
    </section>
  );
};

export default Shop;
