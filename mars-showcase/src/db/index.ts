import localforage from 'localforage';
import type { MarkerData, MediaAsset, TextureState } from '../three/types';

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
const TEXTURES_KEY = 'mars-textures';

const createEmptyTextureState = (): TextureState => ({
  albedo: null,
  normal: null,
  roughness: null
});

export const initDatabase = async () => {
  const existingMarkers = (await metadataStore.getItem<MarkerData[]>(MARKERS_KEY)) || [];
  const existingMedia = (await metadataStore.getItem<MediaAsset[]>(MEDIA_KEY)) || [];
  const existingTextures =
    (await metadataStore.getItem<TextureState>(TEXTURES_KEY)) || createEmptyTextureState();
  if (!existingMarkers.length) {
    await metadataStore.setItem(MARKERS_KEY, existingMarkers);
  }
  if (!existingMedia.length) {
    await metadataStore.setItem(MEDIA_KEY, existingMedia);
  }
  const hasTextureEntry = await metadataStore.getItem<TextureState>(TEXTURES_KEY);
  if (!hasTextureEntry) {
    await metadataStore.setItem(TEXTURES_KEY, existingTextures);
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

export const loadTextures = async (): Promise<TextureState> => {
  const data = await metadataStore.getItem<TextureState>(TEXTURES_KEY);
  return data ?? createEmptyTextureState();
};

export const persistTextures = async (textures: TextureState): Promise<void> => {
  await metadataStore.setItem(TEXTURES_KEY, textures);
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
  textures: TextureState;
}

export const exportAll = async (): Promise<ExportedPayload> => {
  const [markers, media, textures] = await Promise.all([
    loadMarkers(),
    loadMediaAssets(),
    loadTextures()
  ]);
  return { markers, media, textures };
};

export const importAll = async (payload: ExportedPayload) => {
  await Promise.all([
    metadataStore.setItem(MARKERS_KEY, payload.markers),
    metadataStore.setItem(MEDIA_KEY, payload.media),
    metadataStore.setItem(TEXTURES_KEY, payload.textures ?? createEmptyTextureState())
  ]);
};

export const clearAll = async () => {
  await Promise.all([metadataStore.clear(), blobStore.clear()]);
};
