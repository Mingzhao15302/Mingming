/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import Papa from 'papaparse';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event) => {
  const { csvText } = event.data as { csvText: string };
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      self.postMessage({ rows: result.data });
    },
    error: (error) => {
      self.postMessage({ error: error.message });
    }
  });
};
