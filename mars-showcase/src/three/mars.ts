import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Color
} from 'three';

const RADIUS = 5;

export const createMarsMesh = (): Mesh => {
  const geometry = new SphereGeometry(RADIUS, 128, 128);

  // 在初始化阶段使用纯色材质，避免提交二进制贴图。
  // 未来可以将 public/textures/mars_albedo.jpg 等纹理加载到材质中，例如：
  // const textureLoader = new TextureLoader();
  // const albedo = textureLoader.load('/textures/mars_albedo.jpg');
  // material.map = albedo;
  const material = new MeshStandardMaterial({
    color: new Color('#b45309'),
    roughness: 0.8,
    metalness: 0.1
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = 'MarsGlobe';
  return mesh;
};

export const getMarsRadius = () => RADIUS;
