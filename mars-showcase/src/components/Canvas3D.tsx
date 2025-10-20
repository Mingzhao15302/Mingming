import React, { useEffect, useRef } from 'react';
import { Group, MeshStandardMaterial, Raycaster, Texture, TextureLoader, Vector2 } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { createSceneBundle, resizeRenderer } from '../three/scene';
import { createOrbitControls } from '../three/controls';
import { createMarsMesh, getMarsRadius } from '../three/mars';
import { createMarkerMesh, latLonToVector3, pointerToMarkerPosition } from '../three/markers';
import { useAppStore } from '../store/useStore';

const markerRaycaster = new Raycaster();
const markerPointer = new Vector2();

export const Canvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markers = useAppStore((state) => state.markers);
  const selectedMarkerId = useAppStore((state) => state.selectedMarkerId);
  const addMarker = useAppStore((state) => state.addMarker);
  const selectMarker = useAppStore((state) => state.selectMarker);
  const queueToast = useAppStore((state) => state.queueToast);
  const textureUrls = useAppStore((state) => state.textureUrls);

  const bundleRef = useRef<ReturnType<typeof createSceneBundle> | null>(null);
  const markerGroupRef = useRef<Group | null>(null);
  const marsMeshRef = useRef<ReturnType<typeof createMarsMesh> | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bundle = createSceneBundle(container);
    const controls = createOrbitControls(bundle.camera, bundle.renderer);
    controlsRef.current = controls;
    bundleRef.current = bundle;

    const marsMesh = createMarsMesh();
    bundle.scene.add(marsMesh);
    marsMeshRef.current = marsMesh;

    const markerGroup = new Group();
    markerGroup.name = 'MarkerGroup';
    bundle.scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    let animationFrame = 0;
    const animate = () => {
      controls.update();
      bundle.renderer.render(bundle.scene, bundle.camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!bundleRef.current) return;
      resizeRenderer(bundle.renderer, bundle.camera, container);
    };
    window.addEventListener('resize', handleResize);

    const handleClick = async (event: MouseEvent) => {
      if (!bundleRef.current || !marsMeshRef.current || !markerGroupRef.current) return;
      const { camera } = bundleRef.current;
      const bounds = container.getBoundingClientRect();
      markerPointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      markerPointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      markerRaycaster.setFromCamera(markerPointer, camera);
      const intersections = markerRaycaster.intersectObjects(
        markerGroupRef.current.children,
        false
      );
      if (intersections.length) {
        const hit = intersections[0].object;
        const markerId = hit.userData.markerId as string | undefined;
        if (markerId) {
          selectMarker(markerId);
          queueToast('已选中标注');
          return;
        }
      }

      const position = pointerToMarkerPosition(event, container, camera, marsMeshRef.current);
      if (!position) return;
      const marker = await addMarker(position);
      queueToast(`已创建标注：${marker.name}`);
    };

    const handleResetView = () => {
      if (!bundleRef.current || !controlsRef.current) return;
      bundle.camera.position.set(0, 0, 12);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    };

    const handleFlyToMarker = (event: Event) => {
      const detail = (event as CustomEvent<{ latitude: number; longitude: number }>).detail;
      if (!detail || !bundleRef.current || !controlsRef.current) return;
      const target = latLonToVector3(detail.latitude, detail.longitude);
      controlsRef.current.target.copy(target);
      const offset = target.clone().normalize().multiplyScalar(getMarsRadius() + 4);
      bundleRef.current.camera.position.copy(offset);
      controlsRef.current.update();
    };

    container.addEventListener('click', handleClick);
    window.addEventListener('mars-reset-view', handleResetView);
    window.addEventListener('mars-fly-to-marker', handleFlyToMarker as EventListener);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('mars-reset-view', handleResetView);
      window.removeEventListener('mars-fly-to-marker', handleFlyToMarker as EventListener);
      bundle.renderer.dispose();
      bundle.scene.clear();
      container.innerHTML = '';
    };
  }, [addMarker, queueToast, selectMarker]);

  useEffect(() => {
    const markerGroup = markerGroupRef.current;
    if (!markerGroup) return;
    markerGroup.clear();

    markers.forEach((marker) => {
      const mesh = createMarkerMesh(
        marker.id === selectedMarkerId ? '#38bdf8' : '#fbbf24'
      );
      mesh.position.copy(latLonToVector3(marker.latitude, marker.longitude));
      mesh.userData.markerId = marker.id;
      markerGroup.add(mesh);
    });
  }, [markers, selectedMarkerId]);

  useEffect(() => {
    const mesh = marsMeshRef.current;
    if (!mesh) return;
    const material = mesh.material as MeshStandardMaterial;
    const loader = new TextureLoader();
    let cancelled = false;
    const previousTextures: Texture[] = [];

    const loadTexture = async (url: string | null) => {
      if (!url) return null;
      const texture = await loader.loadAsync(url);
      previousTextures.push(texture);
      return texture;
    };

    const applyTextures = async () => {
      try {
        const [map, normalMap, roughnessMap] = await Promise.all([
          loadTexture(textureUrls.albedo),
          loadTexture(textureUrls.normal),
          loadTexture(textureUrls.roughness)
        ]);
        if (cancelled) {
          map?.dispose();
          normalMap?.dispose();
          roughnessMap?.dispose();
          return;
        }

        const oldMap = material.map as Texture | null;
        const oldNormal = material.normalMap as Texture | null;
        const oldRoughness = material.roughnessMap as Texture | null;

        oldMap?.dispose();
        oldNormal?.dispose();
        oldRoughness?.dispose();

        material.map = map ?? null;
        material.normalMap = normalMap ?? null;
        material.roughnessMap = roughnessMap ?? null;

        if (map) {
          material.color.set('#ffffff');
        } else {
          material.color.set('#b45309');
        }

        material.needsUpdate = true;
      } catch (error) {
        console.error('Failed to load textures', error);
      }
    };

    void applyTextures();

    return () => {
      cancelled = true;
      previousTextures.forEach((texture) => texture.dispose());
    };
  }, [textureUrls.albedo, textureUrls.normal, textureUrls.roughness]);

  return <div ref={containerRef} className="h-full w-full" />;
};
