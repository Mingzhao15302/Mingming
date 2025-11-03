import { useEffect, useRef, useState } from 'react';

export default function useIntersectionObserver({ root = null, rootMargin = '0px', threshold = 0.1 } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { root, rootMargin, threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);

  return [ref, visible];
}
