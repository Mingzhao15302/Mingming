import React from 'react';
import { Link } from 'react-router-dom';
import CartItem from '../components/shop/CartItem';
import { useCart } from '../components/shop/CartContext';

const Cart: React.FC = () => {
  const { items, total } = useCart();

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-semibold text-white">购物车</h2>
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/70">
          购物车为空，前往<Link to="/shop" className="ml-1 text-cyan-300">商城</Link>挑选产品。
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <div className="sticky bottom-4 flex flex-col items-end gap-3 rounded-3xl bg-white/10 p-6 backdrop-blur-lg">
            <p className="text-xl text-white">
              合计：<span className="ml-2 text-3xl font-semibold text-cyan-300">¥{total.toLocaleString()}</span>
            </p>
            <Link to="/checkout" className="glass-button">
              去结算
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
