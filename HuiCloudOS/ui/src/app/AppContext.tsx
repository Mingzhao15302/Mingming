import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

export interface User {
  name: string;
}

export interface VideoItem {
  id: string;
  title: string;
  filename: string;
  originalName: string;
  sizeMb: number;
  categories: string[];
  productType?: string;
  meta?: Record<string, any>;
  uploadedAt: string;
  poster?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  specs: { label: string; value: string }[];
  gallery: string[];
  description: string;
}

export interface OrderItem {
  id: string;
  customer: any;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  template: string;
  customer: any;
  items: any[];
  discount: number;
  total: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  videos: VideoItem[];
  products: ProductItem[];
  orders: OrderItem[];
  quotes: QuoteItem[];
  settings: any;
  dashboard: any;
  loading: boolean;
  cart: CartItem[];
  login(username: string, password: string): Promise<void>;
  logout(): void;
  refreshVideos(params?: Record<string, any>): Promise<{ items: VideoItem[]; total: number }>;
  refreshProducts(): Promise<void>;
  refreshOrders(): Promise<void>;
  refreshQuotes(): Promise<void>;
  refreshSettings(): Promise<void>;
  addToCart(product: ProductItem, quantity?: number): void;
  updateCartItem(id: string, quantity: number): void;
  removeFromCart(id: string): void;
  clearCart(): void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('hc-cart');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem('hc-session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch (error) {
        console.error('无法解析会话', error);
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.login({ username, password });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('hc-session', JSON.stringify(response));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hc-session');
  }, []);

  const persistCart = useCallback((updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setCart((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: CartItem[]) => CartItem[])(prev) : updater;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hc-cart', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const addToCart = useCallback(
    (product: ProductItem, quantity = 1) => {
      persistCart((prevCart) => {
        const existing = prevCart.find((item) => item.id === product.id);
        if (existing) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity }];
      });
    },
    [persistCart]
  );

  const updateCartItem = useCallback(
    (id: string, quantity: number) => {
      persistCart((prevCart) =>
        prevCart
          .map((item) => (item.id === id ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0)
      );
    },
    [persistCart]
  );

  const removeFromCart = useCallback(
    (id: string) => {
      persistCart((prevCart) => prevCart.filter((item) => item.id !== id));
    },
    [persistCart]
  );

  const clearCart = useCallback(() => {
    persistCart([]);
  }, [persistCart]);

  const refreshVideos = useCallback(async (params: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { items, total } = await api.fetchVideos(params);
      setVideos(items);
      return { items, total };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await api.fetchProducts();
      setProducts(items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    const { items } = await api.fetchOrders();
    setOrders(items ?? []);
  }, []);

  const refreshQuotes = useCallback(async () => {
    const { items } = await api.fetchQuotes();
    setQuotes(items ?? []);
  }, []);

  const refreshSettings = useCallback(async () => {
    const data = await api.fetchSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    api
      .fetchDashboard()
      .then(setDashboard)
      .catch(() => void 0);
    refreshVideos({ pageSize: 30 });
    refreshProducts();
    refreshOrders();
    refreshQuotes();
    refreshSettings();
  }, [refreshVideos, refreshProducts, refreshOrders, refreshQuotes, refreshSettings]);

  const value = useMemo(
    () => ({
      user,
      token,
      videos,
      products,
      orders,
      quotes,
      settings,
      dashboard,
      loading,
      cart,
      login,
      logout,
      refreshVideos,
      refreshProducts,
      refreshOrders,
      refreshQuotes,
      refreshSettings,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
    }),
    [
      user,
      token,
      videos,
      products,
      orders,
      quotes,
      settings,
      dashboard,
      loading,
      cart,
      login,
      logout,
      refreshVideos,
      refreshProducts,
      refreshOrders,
      refreshQuotes,
      refreshSettings,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp 必须在 AppProvider 中使用');
  }
  return context;
}
