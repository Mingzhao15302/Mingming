import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  productId: string;
  count?: number;
}

export default function ImageCarousel({ productId, count = 3 }: ImageCarouselProps) {
  const images = Array.from(
    { length: count },
    (_, index) => `/static/products/${productId}/gallery/${String(index + 1).padStart(2, '0')}.jpg`
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const next = () => setActive((prev) => (prev + 1) % images.length);
  const prev = () => setActive((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10">
      <img src={images[active]} alt="产品轮播" className="h-80 w-full object-cover" loading="lazy" />
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {images.map((_, index) => (
          <span
            key={index}
            className={`h-2 w-8 rounded-full transition ${index === active ? 'bg-sky-400' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
