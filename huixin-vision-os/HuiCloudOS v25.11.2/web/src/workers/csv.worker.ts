import Papa from 'papaparse';

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event) => {
  const { csv } = event.data as { csv: string };
  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    worker: false,
    complete(results) {
      ctx.postMessage({ records: results.data });
    },
    error(error) {
      ctx.postMessage({ error: error.message });
    },
  });
};
