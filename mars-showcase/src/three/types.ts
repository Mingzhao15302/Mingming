import type { Vector3 } from 'three';

export interface MarkerPosition {
  latitude: number; // degrees
  longitude: number; // degrees
}

export interface MarkerData extends MarkerPosition {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  imageIds: string[];
  videoIds: string[];
}

export interface MarkerHitResult {
  point: Vector3;
  markerId?: string;
  position: MarkerPosition;
}

export type MediaType = 'image' | 'video';

export interface MediaAsset {
  id: string;
  markerId: string;
  type: MediaType;
  blobKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
