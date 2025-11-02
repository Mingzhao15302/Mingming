import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState({ items: [], total: 0, page: 1, pageSize: 30 });
  const [videoFilters, setVideoFilters] = useState({ search: '', categories: {} });
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [settings, setSettings] = useState({ company: {}, logo: '', sales: [] });
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});

  const updateLoading = (key, value) => {
    setLoadingMap((prev) => ({ ...prev, [key]: value }));
  };

  const updateError = (key, value) => {
    setErrorMap((prev) => ({ ...prev, [key]: value }));
  };

  const loadInitialData = async () => {
    try {
      updateLoading('initial', true);
      const [videoRes, productRes, orderRes, quoteRes, settingsRes] = await Promise.all([
        api.get('/api/videos?page=1&pageSize=30'),
        api.get('/api/products'),
        api.get('/api/orders'),
        api.get('/api/quotes'),
        api.get('/api/settings')
      ]);
      setVideos(videoRes);
      setProducts(productRes.items || []);
      setOrders(orderRes.items || []);
      setQuotes(quoteRes.items || []);
      setSettings(settingsRes);
    } catch (error) {
      updateError('initial', error.message);
    } finally {
      updateLoading('initial', false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const value = useMemo(
    () => ({
      api,
      user,
      setUser,
      videos,
      setVideos,
      videoFilters,
      setVideoFilters,
      products,
      setProducts,
      cart,
      setCart,
      orders,
      setOrders,
      quotes,
      setQuotes,
      settings,
      setSettings,
      loadingMap,
      errorMap,
      updateLoading,
      updateError
    }),
    [api, user, videos, videoFilters, products, cart, orders, quotes, settings, loadingMap, errorMap]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
