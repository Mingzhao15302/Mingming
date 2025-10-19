import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/controls/OrbitControls.js';

const sceneContainer = document.getElementById('scene-container');
const statusMessage = document.getElementById('status-message');
const cardLayer = document.getElementById('card-layer');

const nameInput = document.getElementById('place-name');
const latInput = document.getElementById('latitude');
const lonInput = document.getElementById('longitude');
const createButton = document.getElementById('create-marker');
const clearButton = document.getElementById('clear-selection');
const placeList = document.getElementById('place-list');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
sceneContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#030712');

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 0, 4.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.2;
controls.maxDistance = 8;

const ambientLight = new THREE.AmbientLight('#d1d5db', 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('#fef3c7', 1.4);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const marsRadius = 1.6;
const marsGeometry = new THREE.SphereGeometry(marsRadius, 128, 128);
const textureLoader = new THREE.TextureLoader();
const marsTexture = textureLoader.load(
  'https://cdn.jsdelivr.net/gh/ajdruff/planet-textures@master/2k_mars.jpg'
);
const marsBump = textureLoader.load(
  'https://cdn.jsdelivr.net/gh/ajdruff/planet-textures@master/2k_mars_bump.jpg'
);
const marsMaterial = new THREE.MeshPhongMaterial({
  map: marsTexture,
  bumpMap: marsBump,
  bumpScale: 0.04,
  shininess: 6,
});
const marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
scene.add(marsMesh);

const starsGeometry = new THREE.SphereGeometry(50, 64, 64);
const starsMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r158/examples/textures/space/galaxy_starfield.png'),
  side: THREE.BackSide,
});
const starfield = new THREE.Mesh(starsGeometry, starsMaterial);
scene.add(starfield);

const markerGroup = new THREE.Group();
scene.add(markerGroup);

let lastHitPoint = null;
let selectedMarker = null;
let markerSequence = 0;
const markers = new Map();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function resizeRenderer() {
  const { clientWidth, clientHeight } = sceneContainer;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

function onWindowResize() {
  resizeRenderer();
}

resizeRenderer();
window.addEventListener('resize', onWindowResize);

function toLatLon(point) {
  const normalized = point.clone().normalize();
  const lat = THREE.MathUtils.radToDeg(Math.asin(normalized.y));
  const lon = THREE.MathUtils.radToDeg(Math.atan2(normalized.x, normalized.z));
  return { lat, lon };
}

function fromLatLon(lat, lon, radius = marsRadius) {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);
  return new THREE.Vector3(x, y, z);
}

function setStatus(message, timeout = 2200) {
  statusMessage.textContent = message;
  if (timeout) {
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        statusMessage.textContent = '';
      }
    }, timeout);
  }
}

function clearInputs() {
  nameInput.value = '';
  latInput.value = '';
  lonInput.value = '';
  lastHitPoint = null;
  setStatus('已清空当前输入。');
}

function highlightMarker(marker) {
  if (selectedMarker && selectedMarker !== marker) {
    selectedMarker.scale.set(1, 1, 1);
  }
  selectedMarker = marker;
  if (marker) {
    marker.scale.set(1.4, 1.4, 1.4);
  }
}

function createMarkerMesh() {
  const geometry = new THREE.SphereGeometry(0.05, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: '#ff7043',
    emissive: '#ff7043',
    emissiveIntensity: 0.7,
    roughness: 0.4,
    metalness: 0.1,
  });
  return new THREE.Mesh(geometry, material);
}

function ensurePreview(markerData, elements) {
  const { media } = markerData;
  const { preview } = elements;
  if (!media) {
    preview.style.display = 'none';
    preview.replaceChildren();
    return;
  }
  const wrapper = document.createElement(media.type.startsWith('video') ? 'video' : 'img');
  wrapper.src = media.url;
  if (wrapper.tagName === 'VIDEO') {
    wrapper.controls = true;
    wrapper.loop = true;
  }
  preview.replaceChildren(wrapper);
  preview.style.display = 'block';
}

function createCard(marker) {
  const { id, name, lat, lon, notes } = marker.userData;
  const card = document.createElement('div');
  card.className = 'place-card';
  card.dataset.markerId = id;
  card.style.right = '24px';
  card.style.bottom = '28px';

  const header = document.createElement('header');
  const title = document.createElement('h3');
  title.textContent = name || '未命名地标';
  const closeButton = document.createElement('button');
  closeButton.className = 'close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
    card.remove();
    highlightMarker(null);
  });
  header.append(title, closeButton);

  const coordField = document.createElement('div');
  coordField.className = 'card-field';
  coordField.textContent = `纬度 ${lat.toFixed(2)}° · 经度 ${lon.toFixed(2)}°`;

  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'upload-area';
  uploadLabel.textContent = '上传图片或视频';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,video/*';
  uploadLabel.appendChild(fileInput);

  const preview = document.createElement('div');
  preview.className = 'preview-area';

  const textarea = document.createElement('textarea');
  textarea.placeholder = '在此输入关于此地名的描述、科研记录或勘察日志...';
  textarea.value = notes || '';

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) {
      if (marker.userData.media?.url) {
        URL.revokeObjectURL(marker.userData.media.url);
      }
      marker.userData.media = null;
      ensurePreview(marker.userData, { preview });
      updateListItem(id);
      return;
    }
    const url = URL.createObjectURL(file);
    if (marker.userData.media?.url) {
      URL.revokeObjectURL(marker.userData.media.url);
    }
    marker.userData.media = {
      name: file.name,
      type: file.type,
      url,
    };
    ensurePreview(marker.userData, { preview });
    updateListItem(id);
  });

  textarea.addEventListener('input', () => {
    marker.userData.notes = textarea.value;
    updateListItem(id);
  });

  ensurePreview(marker.userData, { preview });

  card.append(header, coordField, uploadLabel, preview, textarea);
  cardLayer.replaceChildren(card);
}

function updateListItem(id) {
  const marker = markers.get(id);
  if (!marker) return;
  const item = placeList.querySelector(`[data-marker-id="${id}"]`);
  if (!item) return;
  const nameText = item.querySelector('.name-text');
  nameText.textContent = marker.userData.name || '未命名地标';
  const meta = item.querySelector('.place-meta');
  meta.textContent = `纬度 ${marker.userData.lat.toFixed(2)}° · 经度 ${marker.userData.lon.toFixed(2)}°`;
  const mediaBadge = item.querySelector('.media-badge');
  if (marker.userData.media) {
    mediaBadge.textContent = marker.userData.media.type.startsWith('video') ? '含视频' : '含图片';
    mediaBadge.style.display = 'inline-flex';
  } else {
    mediaBadge.style.display = 'none';
  }
  const notesBadge = item.querySelector('.notes-badge');
  if (marker.userData.notes?.trim()) {
    notesBadge.style.display = 'inline-flex';
    notesBadge.textContent = '已记录';
  } else {
    notesBadge.style.display = 'none';
  }
}

function addToList(marker) {
  const { id, name, lat, lon } = marker.userData;
  const item = document.createElement('li');
  item.dataset.markerId = id;

  const nameRow = document.createElement('div');
  nameRow.className = 'name-row';
  const title = document.createElement('strong');
  title.className = 'name-text';
  title.textContent = name || '未命名地标';
  const statusDot = document.createElement('span');
  statusDot.className = 'status-dot';
  nameRow.append(title, statusDot);

  const meta = document.createElement('div');
  meta.className = 'place-meta';
  meta.textContent = `纬度 ${lat.toFixed(2)}° · 经度 ${lon.toFixed(2)}°`;

  const badgeRow = document.createElement('div');
  badgeRow.className = 'place-meta';
  badgeRow.style.gap = '8px';

  const mediaBadge = document.createElement('span');
  mediaBadge.className = 'media-badge';
  mediaBadge.style.display = 'none';
  mediaBadge.style.padding = '2px 8px';
  mediaBadge.style.borderRadius = '999px';
  mediaBadge.style.background = 'rgba(255, 111, 60, 0.15)';
  mediaBadge.style.color = '#ffedd5';
  badgeRow.append(mediaBadge);

  const notesBadge = document.createElement('span');
  notesBadge.className = 'notes-badge';
  notesBadge.style.display = 'none';
  notesBadge.style.padding = '2px 8px';
  notesBadge.style.borderRadius = '999px';
  notesBadge.style.background = 'rgba(148, 163, 184, 0.15)';
  notesBadge.style.color = '#e2e8f0';
  badgeRow.append(notesBadge);

  const actionRow = document.createElement('div');
  actionRow.className = 'place-actions';

  const focusButton = document.createElement('button');
  focusButton.className = 'secondary';
  focusButton.textContent = '聚焦';
  focusButton.addEventListener('click', () => {
    focusOnMarker(marker);
  });

  const cardButton = document.createElement('button');
  cardButton.className = 'secondary';
  cardButton.textContent = '打开卡片';
  cardButton.addEventListener('click', () => {
    openMarkerCard(marker);
  });

  actionRow.append(focusButton, cardButton);
  item.append(nameRow, meta, badgeRow, actionRow);
  placeList.appendChild(item);
}

function focusOnMarker(marker) {
  const target = marker.position.clone();
  controls.target.copy(target);
  camera.position.copy(target.clone().multiplyScalar(1.8));
  controls.update();
  openMarkerCard(marker);
}

function openMarkerCard(marker) {
  highlightMarker(marker);
  createCard(marker);
}

function addMarker(name, lat, lon) {
  const resolvedName = name || '未命名地标';
  const position = fromLatLon(lat, lon, marsRadius * 1.02);
  const marker = createMarkerMesh();
  marker.position.copy(position);
  const id = `marker-${++markerSequence}`;
  marker.userData = {
    id,
    name: resolvedName,
    lat,
    lon,
    notes: '',
    media: null,
  };
  markerGroup.add(marker);
  markers.set(id, marker);
  addToList(marker);
  setStatus(`已创建地名：${resolvedName}`);
  return marker;
}

function handleCreateMarker() {
  const name = nameInput.value.trim();
  const lat = Number.parseFloat(latInput.value);
  const lon = Number.parseFloat(lonInput.value);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    setStatus('请先输入有效的经纬度。');
    return;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    setStatus('纬度范围 -90~90，经度范围 -180~180。');
    return;
  }
  const marker = addMarker(name, lat, lon);
  openMarkerCard(marker);
  nameInput.value = '';
}

createButton.addEventListener('click', handleCreateMarker);
clearButton.addEventListener('click', clearInputs);

function handlePointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const markerHits = raycaster.intersectObjects(markerGroup.children, true);
  if (markerHits.length > 0) {
    const marker = markerHits[0].object;
    openMarkerCard(marker);
    return;
  }

  const hits = raycaster.intersectObject(marsMesh);
  if (hits.length === 0) return;
  lastHitPoint = hits[0].point.clone();
  const { lat, lon } = toLatLon(lastHitPoint);
  latInput.value = lat.toFixed(4);
  lonInput.value = lon.toFixed(4);
  setStatus(`已选择火星坐标：纬度 ${lat.toFixed(2)}°，经度 ${lon.toFixed(2)}°`);
}

renderer.domElement.addEventListener('pointerdown', handlePointerDown);

function animate() {
  requestAnimationFrame(animate);
  marsMesh.rotation.y += 0.0006;
  controls.update();
  renderer.render(scene, camera);
}

animate();
