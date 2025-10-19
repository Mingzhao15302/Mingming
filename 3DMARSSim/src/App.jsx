import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { TextureLoader } from 'three';

const MARS_BUMP_URL =
  'https://www.solarsystemscope.com/textures/download/2k_mars.jpg';

const MARS_RADIUS = 4;

function latLonToVector3(lat, lon, radius = MARS_RADIUS) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}

function Mars() {
  const colorMap = useLoader(TextureLoader, MARS_BUMP_URL);
  return (
    <mesh>
      <sphereGeometry args={[MARS_RADIUS, 64, 64]} />
      <meshStandardMaterial map={colorMap} />
    </mesh>
  );
}

function Marker({ location, onSelect, isActive }) {
  const [x, y, z] = useMemo(
    () => latLonToVector3(location.lat, location.lon, MARS_RADIUS + 0.05),
    [location.lat, location.lon],
  );

  const markerRef = useRef();
  useFrame(() => {
    if (markerRef.current) {
      markerRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group position={[x, y, z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(location.id);
      }}
    >
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={isActive ? '#ff9800' : '#00bcd4'} emissive={isActive ? '#ff9800' : '#004b56'} />
      </mesh>
      <Html center className="marker-label" distanceFactor={15}>
        <div className={`marker-chip ${isActive ? 'active' : ''}`}>{location.name}</div>
      </Html>
    </group>
  );
}

export default function App() {
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ name: '', lat: '', lon: '' });
  const objectUrlsRef = useRef(new Set());

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedId) ?? null,
    [locations, selectedId],
  );

  const handleAddLocation = (event) => {
    event.preventDefault();
    const name = formData.name.trim();
    const lat = parseFloat(formData.lat);
    const lon = parseFloat(formData.lon);

    if (!name || Number.isNaN(lat) || Number.isNaN(lon)) {
      alert('请输入有效的地名、纬度和经度。');
      return;
    }

    const newLocation = {
      id: crypto.randomUUID(),
      name,
      lat: Math.max(-90, Math.min(90, lat)),
      lon: ((lon + 540) % 360) - 180,
      description: '',
      mediaUrl: '',
      mediaType: null,
      mediaObjectUrl: false,
    };

    setLocations((prev) => [...prev, newLocation]);
    setFormData({ name: '', lat: '', lon: '' });
    setSelectedId(newLocation.id);
  };

  const handleSelectLocation = (id) => {
    setSelectedId(id);
  };

  const handleDescriptionChange = (event) => {
    const value = event.target.value;
    if (!selectedLocation) return;

    setLocations((prev) =>
      prev.map((loc) => (loc.id === selectedLocation.id ? { ...loc, description: value } : loc)),
    );
  };

  const handleMediaUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLocation) return;

    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== selectedLocation.id) {
          return loc;
        }

        if (loc.mediaObjectUrl && loc.mediaUrl) {
          URL.revokeObjectURL(loc.mediaUrl);
          objectUrlsRef.current.delete(loc.mediaUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(objectUrl);

        return {
          ...loc,
          mediaUrl: objectUrl,
          mediaType: file.type.startsWith('video') ? 'video' : 'image',
          mediaObjectUrl: true,
        };
      }),
    );
    event.target.value = '';
  };

  React.useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  return (
    <div className="app-container">
      <div className="control-panel">
        <h1>火星控制台</h1>
        <form className="location-form" onSubmit={handleAddLocation}>
          <label>
            地名
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="输入火星地标名称"
              required
            />
          </label>
          <label>
            纬度 (-90 至 90)
            <input
              type="number"
              step="0.1"
              value={formData.lat}
              onChange={(event) => setFormData((prev) => ({ ...prev, lat: event.target.value }))}
              placeholder="例如：18.65"
              required
            />
          </label>
          <label>
            经度 (-180 至 180)
            <input
              type="number"
              step="0.1"
              value={formData.lon}
              onChange={(event) => setFormData((prev) => ({ ...prev, lon: event.target.value }))}
              placeholder="例如：226.2"
              required
            />
          </label>
          <button type="submit">添加地名</button>
        </form>
        <div className="location-list">
          <h2>地名列表</h2>
          {locations.length === 0 ? (
            <p className="empty">尚未创建地名，使用上方表单添加新地点。</p>
          ) : (
            <ul>
              {locations.map((location) => (
                <li key={location.id}>
                  <button
                    type="button"
                    className={location.id === selectedId ? 'active' : ''}
                    onClick={() => handleSelectLocation(location.id)}
                  >
                    {location.name}
                  </button>
                  <span className="coords">
                    lat {location.lat.toFixed(1)}°, lon {location.lon.toFixed(1)}°
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="viewer">
        <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
          <color attach="background" args={['#020817']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Stars radius={50} depth={60} count={5000} factor={4} fade />
          <Mars />
          {locations.map((location) => (
            <Marker
              key={location.id}
              location={location}
              isActive={location.id === selectedId}
              onSelect={handleSelectLocation}
            />
          ))}
          <OrbitControls enablePan enableZoom zoomSpeed={0.6} rotateSpeed={0.5} />
        </Canvas>
      </div>
      {selectedLocation && (
        <div className="detail-card">
          <header>
            <h2>{selectedLocation.name}</h2>
            <button type="button" onClick={() => setSelectedId(null)}>
              关闭
            </button>
          </header>
          <div className="card-body">
            <p className="card-coords">
              纬度 {selectedLocation.lat.toFixed(2)}°，经度 {selectedLocation.lon.toFixed(2)}°
            </p>
            <label className="card-section">
              上传图片或视频
              <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} />
            </label>
            {selectedLocation.mediaUrl && (
              <div className="media-preview">
                {selectedLocation.mediaType === 'video' ? (
                  <video controls src={selectedLocation.mediaUrl} />
                ) : (
                  <img src={selectedLocation.mediaUrl} alt={selectedLocation.name} />
                )}
              </div>
            )}
            <label className="card-section">
              内容记录
              <textarea
                rows={6}
                value={selectedLocation.description}
                onChange={handleDescriptionChange}
                placeholder="在这里记录科研日志、观察或任务说明..."
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
