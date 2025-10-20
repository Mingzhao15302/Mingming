import {
  AmbientLight,
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three';

interface SceneBundle {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  clock: Clock;
}

export const createSceneBundle = (container: HTMLElement): SceneBundle => {
  const scene = new Scene();
  const camera = new PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 12);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new AmbientLight('#ffffff', 1);
  scene.add(ambient);

  const clock = new Clock();

  return { scene, camera, renderer, clock };
};

export const resizeRenderer = (
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  container: HTMLElement
) => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
