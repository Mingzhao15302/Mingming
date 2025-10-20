import localforage from 'localforage';
import type { MarkerData, MediaAsset } from '../three/types';

const metadataStore = localforage.createInstance({
  name: 'mars-showcase',
  storeName: 'metadata'
});

const blobStore = localforage.createInstance({
  name: 'mars-showcase',
  storeName: 'blobs'
});

const MARKERS_KEY = 'markers';
const MEDIA_KEY = 'media-assets';

export const initDatabase = async () => {
  const existingMarkers = (await metadataStore.getItem<MarkerData[]>(MARKERS_KEY)) || [];
  const existingMedia = (await metadataStore.getItem<MediaAsset[]>(MEDIA_KEY)) || [];
  if (!existingMarkers.length) {
    await metadataStore.setItem(MARKERS_KEY, existingMarkers);
  }
  if (!existingMedia.length) {
    await metadataStore.setItem(MEDIA_KEY, existingMedia);
  }
};

export const loadMarkers = async (): Promise<MarkerData[]> => {
  const data = await metadataStore.getItem<MarkerData[]>(MARKERS_KEY);
  return data ?? [];
};

export const persistMarkers = async (markers: MarkerData[]): Promise<void> => {
  await metadataStore.setItem(MARKERS_KEY, markers);
};

export const loadMediaAssets = async (): Promise<MediaAsset[]> => {
  const data = await metadataStore.getItem<MediaAsset[]>(MEDIA_KEY);
  return data ?? [];
};

export const persistMediaAssets = async (media: MediaAsset[]): Promise<void> => {
  await metadataStore.setItem(MEDIA_KEY, media);
};

export const saveBlob = async (key: string, blob: Blob) => {
  await blobStore.setItem(key, blob);
};

export const loadBlob = async (key: string) => {
  return blobStore.getItem<Blob>(key);
};

export const removeBlob = async (key: string) => {
  await blobStore.removeItem(key);
};

export interface ExportedPayload {
  markers: MarkerData[];
  media: MediaAsset[];
}

export const exportAll = async (): Promise<ExportedPayload> => {
  const [markers, media] = await Promise.all([loadMarkers(), loadMediaAssets()]);
  return { markers, media };
};

export const importAll = async (payload: ExportedPayload) => {
  await Promise.all([
    metadataStore.setItem(MARKERS_KEY, payload.markers),
    metadataStore.setItem(MEDIA_KEY, payload.media)
  ]);
};

export const clearAll = async () => {
  await Promise.all([metadataStore.clear(), blobStore.clear()]);
};
