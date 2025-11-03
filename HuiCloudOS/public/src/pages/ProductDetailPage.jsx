import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProducts } from '../utils/api.js';
import { ImageCarousel } from '../components/ImageCarousel.jsx';
import { SpecsTable } from '../components/SpecsTable.jsx';
import { AddToCartButton } from '../components/AddToCartButton.jsx';
import { useCart, useToast } from '../hooks/useApp.js';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchProducts();
        const found = result.items.find((item) => item.id === productId);
        setProduct(found || null);
      } catch (error) {
        toast.push(error.message || '加载产品失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId, toast]);

  if (loading) {
    return <div className="status-pill">加载中…</div>;
  }

  if (!product) {
    return (
      <div className="glass-card" style={{ padding: '2rem' }}>
        <p>未找到产品，返回商城查看更多产品。</p>
        <button className="button" onClick={() => navigate('/shop')}>
          返回商城
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
      <ImageCarousel productId={product.id} images={product.images} />
      <div className="glass-card" style={{ padding: '2rem', display: 'grid', gap: '1rem' }}>
        <h1 style={{ marginBottom: 0 }}>{product.name}</h1>
        <div className="badge">型号 {product.model}</div>
        <p style={{ marginTop: 0, color: 'rgba(15,23,42,0.75)' }}>{product.description}</p>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>￥{product.price.toLocaleString()}</div>
        <AddToCartButton
          onClick={() => {
            cart.add(product);
            toast.push('已加入购物车');
          }}
        />
      </div>
      <SpecsTable specs={product.specs} />
    </div>
  );
};

export default ProductDetailPage;
