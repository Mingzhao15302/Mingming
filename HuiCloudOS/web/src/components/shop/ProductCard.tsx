import Button from '../common/Button';

interface ProductCardProps {
  product: {
    id: number;
    productId: string;
    name: string;
    price: number;
    description?: string;
  };
  onAddToCart: (productId: string) => void;
  onOpenDetail: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart, onOpenDetail }: ProductCardProps) {
  const imagePath = `/static/products/${product.productId}/card.jpg`;
  return (
    <div className="glass-card flex flex-col gap-4 p-5">
      <button type="button" onClick={() => onOpenDetail(product.productId)} className="flex flex-col gap-4 text-left">
        <div className="aspect-video overflow-hidden rounded-2xl bg-white/5">
          <img src={imagePath} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/90">{product.name}</h3>
          <p className="text-sm text-slate-300 line-clamp-2">{product.description ?? '高性能灌装自动化方案'}</p>
        </div>
      </button>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-lg font-semibold text-sky-200">¥{product.price.toFixed(2)}</span>
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart(product.productId);
          }}
          className="px-4 py-2"
        >
          加入购物车
        </Button>
      </div>
    </div>
  );
}
