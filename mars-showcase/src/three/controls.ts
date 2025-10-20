import { OrbitControls } from 'three-stdlib';
import type { PerspectiveCamera, WebGLRenderer } from 'three';

export const createOrbitControls = (
  camera: PerspectiveCamera,
  renderer: WebGLRenderer
) => {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 20;
  controls.zoomSpeed = 0.8;
  return controls;
};
