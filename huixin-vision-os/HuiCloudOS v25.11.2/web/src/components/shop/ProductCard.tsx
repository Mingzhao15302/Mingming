import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartProduct, useCart } from './CartContext';

interface ProductCardProps {
  product: CartProduct & { description: string };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white/10 shadow-lg backdrop-blur-md transition hover:shadow-glow">
      <Link to={`/products/${product.id}`} className="relative block flex-1">
        <img
          src={`/products/${product.id}/card.jpg`}
          alt={product.name}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </Link>
      <div className="flex flex-col gap-3 p-6">
        <div>
          <h3 className="text-xl font-semibold text-white">{product.name}</h3>
          <p className="text-sm text-white/60">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold text-cyan-300">¥{product.price.toLocaleString()}</span>
          <button
            type="button"
            className="glass-button flex items-center gap-2 bg-cyan-500/80"
            onClick={(event) => {
              event.preventDefault();
              addItem(product);
            }}
          >
            <ShoppingCart size={18} />
            加入购物车
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
