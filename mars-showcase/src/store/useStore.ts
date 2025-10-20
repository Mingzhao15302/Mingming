import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  MarkerData,
  MediaAsset,
  MediaType,
  TextureInfo,
  TextureSlot,
  TextureState
} from '../three/types';
import {
  initDatabase,
  loadMarkers,
  persistMarkers,
  loadMediaAssets,
  persistMediaAssets,
  loadTextures,
  persistTextures,
  exportAll,
  importAll,
  saveBlob,
  loadBlob,
  removeBlob,
  type ExportedPayload
} from '../db';
import { AUTO_LINE_NAMES } from '../constants/lines';

const textureSlots: TextureSlot[] = ['albedo', 'normal', 'roughness'];

const createEmptyTextureState = (): TextureState => ({
  albedo: null,
  normal: null,
  roughness: null
});

type TextureUrlState = Record<TextureSlot, string | null>;

const createEmptyTextureUrls = (): TextureUrlState => ({
  albedo: null,
  normal: null,
  roughness: null
});

const buildTextureUrls = async (textures: TextureState): Promise<TextureUrlState> => {
  const entries = await Promise.all(
    textureSlots.map(async (slot) => {
      const texture = textures[slot];
      if (!texture) return [slot, null] as const;
      const blob = await loadBlob(texture.blobKey);
      if (!blob) return [slot, null] as const;
      return [slot, URL.createObjectURL(blob)] as const;
    })
  );
  return entries.reduce<TextureUrlState>((acc, [slot, url]) => {
    acc[slot] = url;
    return acc;
  }, createEmptyTextureUrls());
};

const revokeTextureUrls = (urls: TextureUrlState) => {
  textureSlots.forEach((slot) => {
    const url = urls[slot];
    if (url) {
      URL.revokeObjectURL(url);
    }
  });
};

export type ToastLevel = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  level: ToastLevel;
}

interface FilterState {
  hasMediaOnly: boolean;
}

interface AppState {
  initialized: boolean;
  markers: MarkerData[];
  mediaAssets: MediaAsset[];
  textures: TextureState;
  textureUrls: TextureUrlState;
  selectedMarkerId: string | null;
  searchTerm: string;
  filter: FilterState;
  toasts: Toast[];
  initialize: () => Promise<void>;
  addMarker: (position: { latitude: number; longitude: number }) => Promise<MarkerData>;
  updateMarker: (id: string, patch: Partial<MarkerData>) => Promise<void>;
  removeMarker: (id: string) => Promise<void>;
  selectMarker: (id: string | null) => void;
  setSearchTerm: (value: string) => void;
  toggleHasMediaFilter: () => void;
  queueToast: (message: string, level?: ToastLevel) => void;
  dismissToast: (id: string) => void;
  exportData: () => Promise<ExportedPayload>;
  importData: (payload: ExportedPayload) => Promise<void>;
  addMedia: (
    markerId: string,
    file: File,
    type: MediaType
  ) => Promise<MediaAsset | null>;
  removeMedia: (id: string) => Promise<void>;
  generatePresetMarkers: () => Promise<void>;
  getBlobUrl: (blobKey: string) => Promise<string | null>;
  setTexture: (slot: TextureSlot, file: File) => Promise<TextureInfo | null>;
  clearTexture: (slot: TextureSlot) => Promise<void>;
}

const createMarker = (name: string, latitude: number, longitude: number): MarkerData => {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    name,
    description: '',
    latitude,
    longitude,
    createdAt: now,
    updatedAt: now,
    imageIds: [],
    videoIds: []
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  markers: [],
  mediaAssets: [],
  textures: createEmptyTextureState(),
  textureUrls: createEmptyTextureUrls(),
  selectedMarkerId: null,
  searchTerm: '',
  filter: { hasMediaOnly: false },
  toasts: [],
  initialize: async () => {
    await initDatabase();
    const [markers, media, textures] = await Promise.all([
      loadMarkers(),
      loadMediaAssets(),
      loadTextures()
    ]);
    const textureUrls = await buildTextureUrls(textures);
    set({ markers, mediaAssets: media, textures, textureUrls, initialized: true });
  },
  addMarker: async ({ latitude, longitude }) => {
    const name = AUTO_LINE_NAMES[Math.floor(Math.random() * AUTO_LINE_NAMES.length)];
    const marker = createMarker(name, latitude, longitude);
    const markers = [...get().markers, marker];
    await persistMarkers(markers);
    set({ markers, selectedMarkerId: marker.id });
    return marker;
  },
  updateMarker: async (id, patch) => {
    const markers = get().markers.map((marker) =>
      marker.id === id ? { ...marker, ...patch, updatedAt: new Date().toISOString() } : marker
    );
    await persistMarkers(markers);
    set({ markers });
  },
  removeMarker: async (id) => {
    const marker = get().markers.find((item) => item.id === id);
    const markers = get().markers.filter((item) => item.id !== id);
    const mediaAssets = get().mediaAssets.filter((asset) => asset.markerId !== id);
    await Promise.all([
      persistMarkers(markers),
      persistMediaAssets(mediaAssets),
      ...(marker
        ? [...marker.imageIds, ...marker.videoIds].map((blobKey) => removeBlob(blobKey))
        : [])
    ]);
    set({
      markers,
      mediaAssets,
      selectedMarkerId: get().selectedMarkerId === id ? null : get().selectedMarkerId
    });
  },
  selectMarker: (id) => set({ selectedMarkerId: id }),
  setSearchTerm: (value) => set({ searchTerm: value }),
  toggleHasMediaFilter: () => set((state) => ({
    filter: { hasMediaOnly: !state.filter.hasMediaOnly }
  })),
  queueToast: (message, level = 'info') => {
    const toast: Toast = { id: nanoid(), message, level };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => {
      get().dismissToast(toast.id);
    }, 3000);
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  exportData: async () => exportAll(),
  importData: async (payload) => {
    await importAll(payload);
    const [markers, media, textures] = await Promise.all([
      loadMarkers(),
      loadMediaAssets(),
      loadTextures()
    ]);
    const previousUrls = get().textureUrls;
    revokeTextureUrls(previousUrls);
    const textureUrls = await buildTextureUrls(textures);
    set({ markers, mediaAssets: media, textures, textureUrls });
  },
  addMedia: async (markerId, file, type) => {
    const marker = get().markers.find((item) => item.id === markerId);
    if (!marker) return null;
    const blobKey = nanoid();
    await saveBlob(blobKey, file);
    const asset: MediaAsset = {
      id: nanoid(),
      markerId,
      type,
      blobKey,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: new Date().toISOString()
    };
    const mediaAssets = [...get().mediaAssets, asset];
    await persistMediaAssets(mediaAssets);
    const markerPatch = {
      ...marker,
      imageIds:
        type === 'image' ? [...marker.imageIds, blobKey] : marker.imageIds,
      videoIds:
        type === 'video' ? [...marker.videoIds, blobKey] : marker.videoIds,
      updatedAt: new Date().toISOString()
    };
    const markers = get().markers.map((item) => (item.id === markerId ? markerPatch : item));
    await persistMarkers(markers);
    set({ markers, mediaAssets });
    return asset;
  },
  removeMedia: async (id) => {
    const asset = get().mediaAssets.find((item) => item.id === id);
    if (!asset) return;
    await removeBlob(asset.blobKey);
    const mediaAssets = get().mediaAssets.filter((item) => item.id !== id);
    await persistMediaAssets(mediaAssets);
    const markers = get().markers.map((marker) => {
      if (marker.id !== asset.markerId) return marker;
      return {
        ...marker,
        imageIds: marker.imageIds.filter((key) => key !== asset.blobKey),
        videoIds: marker.videoIds.filter((key) => key !== asset.blobKey),
        updatedAt: new Date().toISOString()
      };
    });
    await persistMarkers(markers);
    set({ markers, mediaAssets });
  },
  generatePresetMarkers: async () => {
    const generated = AUTO_LINE_NAMES.map((name) =>
      createMarker(
        name,
        Math.random() * 180 - 90,
        Math.random() * 360 - 180
      )
    );
    await persistMarkers(generated);
    set({ markers: generated, selectedMarkerId: generated[0]?.id ?? null });
  },
  getBlobUrl: async (blobKey) => {
    const blob = await loadBlob(blobKey);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  },
  setTexture: async (slot, file) => {
    const blobKey = nanoid();
    await saveBlob(blobKey, file);
    const state = get();
    const previousTexture = state.textures[slot];
    const textures = { ...state.textures };
    const info: TextureInfo = {
      slot,
      blobKey,
      fileName: file.name,
      mimeType: file.type,
      createdAt: new Date().toISOString()
    };
    textures[slot] = info;
    await persistTextures(textures);
    if (previousTexture) {
      await removeBlob(previousTexture.blobKey);
    }
    const blob = await loadBlob(blobKey);
    if (!blob) return null;
    const previousUrls = get().textureUrls;
    const previousUrl = previousUrls[slot];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
    const url = URL.createObjectURL(blob);
    set({
      textures,
      textureUrls: { ...previousUrls, [slot]: url }
    });
    return info;
  },
  clearTexture: async (slot) => {
    const state = get();
    const texture = state.textures[slot];
    if (!texture) return;
    const textures = { ...state.textures, [slot]: null };
    await persistTextures(textures);
    await removeBlob(texture.blobKey);
    const previousUrls = get().textureUrls;
    const url = previousUrls[slot];
    if (url) {
      URL.revokeObjectURL(url);
    }
    set({
      textures,
      textureUrls: { ...previousUrls, [slot]: null }
    });
  }
}));
