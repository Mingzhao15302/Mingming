import React, { useMemo, useState } from 'react';

interface ImageCarouselProps {
  productId: string;
  total?: number;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ productId, total = 3 }) => {
  const [index, setIndex] = useState(0);
  const images = useMemo(() => Array.from({ length: total }, (_, i) => `/products/${productId}/gallery/0${i + 1}.jpg`), [productId, total]);

  return (
    <div className="overflow-hidden rounded-3xl bg-white/5 p-4 shadow-lg">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
        <img src={images[index]} alt={`${productId} 图像 ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="mt-4 flex justify-center gap-3">
        {images.map((image, i) => (
          <button
            key={image}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-3 w-10 rounded-full transition ${index === i ? 'bg-cyan-400' : 'bg-white/20'}`}
            aria-label={`切换到第 ${i + 1} 张`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
