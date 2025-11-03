import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchJSON } from '../utils/http.js';

const AppContext = createContext(null);

export function AppProvider({ children, navigate, currentHash }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videoMeta, setVideoMeta] = useState({ total: 0, pageSize: 30, page: 1 });
  const [videoFilters, setVideoFilters] = useState({});
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchJSON('/api/session')
      .then((session) => {
        if (session?.user) {
          setUser(session.user);
        }
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const refreshVideos = async (page = 1, filters = videoFilters) => {
    const params = new URLSearchParams({ page, pageSize: videoMeta.pageSize.toString() });
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value) {
        params.set(key, value);
      }
    });
    const result = await fetchJSON(`/api/videos?${params.toString()}`);
    setVideos((prev) => (page === 1 ? result.items : [...prev, ...result.items]));
    setVideoMeta({ total: result.total, pageSize: result.pageSize, page: result.page });
    setVideoFilters(filters);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      loadingUser,
      videos,
      videoMeta,
      videoFilters,
      refreshVideos,
      products,
      setProducts,
      cart,
      setCart,
      navigate,
      currentHash
    }),
    [user, loadingUser, videos, videoMeta, videoFilters, products, cart, navigate, currentHash]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
