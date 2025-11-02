import { useEffect, useRef } from 'react';

let workerInstance = null;

function getWorker() {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/csvWorker.js', import.meta.url), { type: 'module' });
  }
  return workerInstance;
}

export function useCsvWorker() {
  const handlers = useRef(new Map());

  useEffect(() => {
    const worker = getWorker();
    const listener = (event) => {
      const { id, type, result } = event.data;
      const handler = handlers.current.get(id);
      if (handler) {
        handler({ type, result });
        handlers.current.delete(id);
      }
    };
    worker.addEventListener('message', listener);
    return () => {
      worker.removeEventListener('message', listener);
    };
  }, []);

  return {
    parse: (text) =>
      new Promise((resolve) => {
        const id = crypto.randomUUID();
        handlers.current.set(id, (payload) => resolve(payload.result));
        getWorker().postMessage({ type: 'parse', payload: { text, id } });
      }),
    stringify: (headers, rows) =>
      new Promise((resolve) => {
        const id = crypto.randomUUID();
        handlers.current.set(id, (payload) => resolve(payload.result));
        getWorker().postMessage({ type: 'stringify', payload: { headers, rows, id } });
      })
  };
}
