import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FloatingCartButtonProps {
  itemCount: number;
}

export default function FloatingCartButton({ itemCount }: FloatingCartButtonProps) {
  return (
    <Link
      to="/cart"
      className="fixed bottom-8 right-8 flex items-center gap-3 rounded-full bg-sky-500/90 px-5 py-3 text-white shadow-2xl shadow-sky-500/40 transition hover:scale-105"
    >
      <ShoppingCart className="h-5 w-5" />
      <span>购物车 ({itemCount})</span>
    </Link>
  );
}
