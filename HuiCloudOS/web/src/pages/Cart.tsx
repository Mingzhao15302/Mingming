import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import CartItem from '../components/shop/CartItem';
import Button from '../components/common/Button';
import { CartItem as CartEntry, getCart, removeFromCart, updateCart } from '../app/cart';

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartEntry[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdate = (productId: string, quantity: number) => {
    const updated = updateCart(productId, quantity);
    setItems(updated);
  };

  const handleRemove = (productId: string) => {
    const updated = removeFromCart(productId);
    setItems(updated);
  };

  return (
    <AppShell>
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold text-white">购物车</h2>
        <div className="space-y-4">
          {items.length === 0 && <div className="rounded-3xl bg-white/10 p-6 text-slate-300">购物车为空</div>}
          {items.map((item) => (
            <CartItem key={item.productId} item={item} onUpdate={handleUpdate} onRemove={handleRemove} />
          ))}
        </div>
        <div className="sticky bottom-10 flex items-center justify-between rounded-3xl bg-white/10 p-6 shadow-lg">
          <div className="text-lg text-slate-200">
            合计：<span className="text-2xl font-bold text-white">¥{subtotal.toFixed(2)}</span>
          </div>
          <Button onClick={() => navigate('/checkout')} className="px-6 py-3 text-base">
            去结算
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
