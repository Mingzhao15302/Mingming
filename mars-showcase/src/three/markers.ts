import {
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three';
import { getMarsRadius } from './mars';
import type { MarkerPosition } from './types';

const raycaster = new Raycaster();
const pointer = new Vector2();

export const createMarkerMesh = (color = '#38bdf8'): Mesh => {
  const geometry = new SphereGeometry(0.08, 16, 16);
  const material = new MeshBasicMaterial({ color });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'MarkerIndicator';
  return mesh;
};

export const latLonToVector3 = (
  latitude: number,
  longitude: number,
  radius = getMarsRadius()
): Vector3 => {
  // 纬度/经度以度为单位。纬度 0 在赤道，正值指向北半球，经度 0 在 x 轴方向，正值沿东经。
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  const x = radius * Math.cos(lat) * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  return new Vector3(x, y, z);
};

export const vector3ToLatLon = (vector: Vector3): MarkerPosition => {
  // 反向转换：通过反三角函数获取经纬度。
  const radius = vector.length();
  const lat = Math.asin(vector.y / radius);
  const lon = Math.atan2(vector.z, vector.x);
  return {
    latitude: (lat * 180) / Math.PI,
    longitude: (lon * 180) / Math.PI
  };
};

export const pointerToMarkerPosition = (
  event: MouseEvent,
  container: HTMLElement,
  camera: PerspectiveCamera,
  target: Mesh
): MarkerPosition | null => {
  const bounds = container.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(target, false);
  if (!intersects.length) {
    return null;
  }
  return vector3ToLatLon(intersects[0].point.clone().normalize().multiplyScalar(getMarsRadius()));
};
