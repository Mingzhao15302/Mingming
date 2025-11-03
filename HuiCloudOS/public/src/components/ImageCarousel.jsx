import React, { useEffect, useMemo, useState } from 'react';

export const ImageCarousel = ({ productId, images = [] }) => {
  const [index, setIndex] = useState(0);
  const slides = useMemo(() => {
    if (images.length) return images;
    return new Array(4).fill(null).map((_, idx) => `/products/${productId}/${idx + 1}.svg`);
  }, [images, productId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="carousel">
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)`, width: `${slides.length * 100}%` }}>
        {slides.map((src, idx) => (
          <div key={idx} style={{ flex: '0 0 100%' }}>
            <img src={src} alt={`产品图 ${idx + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
      <button className="prev" onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}>
        ‹
      </button>
      <button className="next" onClick={() => setIndex((prev) => (prev + 1) % slides.length)}>
        ›
      </button>
    </div>
  );
};

export default ImageCarousel;
