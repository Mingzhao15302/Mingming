import { useCallback, useEffect, useRef, useState } from 'react';

export function useUploadQueue({ concurrency = 3, uploader }) {
  const [items, setItems] = useState([]);
  const activeCount = useRef(0);

  const startNext = useCallback(() => {
    if (activeCount.current >= concurrency) {
      return;
    }
    setItems((prev) => {
      const nextIndex = prev.findIndex((item) => item.status === 'pending');
      if (nextIndex === -1) {
        return prev;
      }
      const nextItems = [...prev];
      nextItems[nextIndex] = { ...nextItems[nextIndex], status: 'uploading' };
      const task = nextItems[nextIndex];
      activeCount.current += 1;
      uploader(task.file, (progress) => {
        setItems((current) => current.map((item) => (item.id === task.id ? { ...item, progress } : item)));
      })
        .then((response) => {
          setItems((current) =>
            current.map((item) =>
              item.id === task.id ? { ...item, status: 'done', progress: 100, response } : item
            )
          );
        })
        .catch((error) => {
          setItems((current) =>
            current.map((item) =>
              item.id === task.id
                ? { ...item, status: 'failed', error: error.message || '上传失败' }
                : item
            )
          );
        })
        .finally(() => {
          activeCount.current -= 1;
          startNext();
        });
      return nextItems;
    });
  }, [concurrency, uploader]);

  const enqueue = useCallback(
    (files) => {
      setItems((prev) => [
        ...prev,
        ...files.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          progress: 0,
          status: 'pending',
          error: ''
        }))
      ]);
    },
    []
  );

  const retry = useCallback((id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'pending', progress: 0, error: '' } : item))
    );
  }, []);

  useEffect(() => {
    if (items.some((item) => item.status === 'pending') && activeCount.current < concurrency) {
      startNext();
    }
  }, [items, concurrency, startNext]);

  return { items, enqueue, retry };
}
