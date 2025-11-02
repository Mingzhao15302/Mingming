import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as Item, useCart } from './CartContext';

interface CartItemProps {
  item: Item;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <img src={`/products/${item.id}/card.jpg`} alt={item.name} className="h-24 w-24 rounded-2xl object-cover" />
        <div>
          <h3 className="text-lg font-semibold text-white">{item.name}</h3>
          <p className="text-sm text-white/60">¥{item.price.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-full bg-white/10 p-2" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
          <Minus size={18} />
        </button>
        <span className="min-w-[2rem] text-center text-lg">{item.quantity}</span>
        <button type="button" className="rounded-full bg-white/10 p-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
          <Plus size={18} />
        </button>
        <button type="button" className="rounded-full bg-white/10 p-2 text-rose-300" onClick={() => removeItem(item.id)}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
