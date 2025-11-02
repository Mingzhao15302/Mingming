import Button from '../common/Button';

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  };
  onUpdate: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdate, onRemove }: CartItemProps) {
  const imagePath = `/static/products/${item.productId}/card.jpg`;
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <img src={imagePath} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
        <div>
          <h4 className="text-lg font-semibold text-white/90">{item.name}</h4>
          <p className="text-sm text-slate-300">¥{item.price.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onUpdate(item.productId, Math.max(1, item.quantity - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white"
        >
          -
        </button>
        <span className="w-10 text-center text-white">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdate(item.productId, item.quantity + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white"
        >
          +
        </button>
        <Button onClick={() => onRemove(item.productId)} className="bg-rose-500/80 px-4 py-2">
          删除
        </Button>
      </div>
    </div>
  );
}
