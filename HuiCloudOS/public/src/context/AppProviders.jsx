import React, { createContext, useCallback, useMemo, useState } from 'react';

export const SidebarContext = createContext({
  isOpen: false,
  toggle: () => {},
  close: () => {}
});

export const AuthContext = createContext({
  token: null,
  profile: null,
  login: async () => {},
  logout: () => {}
});

export const ToastContext = createContext({
  toasts: [],
  push: () => {},
  remove: () => {}
});

export const CartContext = createContext({
  items: [],
  add: () => {},
  remove: () => {},
  update: () => {},
  clear: () => {}
});

const readLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('Read local storage failed', error);
    return fallback;
  }
};

export const AppProviders = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const [token, setToken] = useState(() => localStorage.getItem('huicloud-token'));
  const [profile, setProfile] = useState(() => readLocal('huicloud-profile', null));

  const login = useCallback((payload) => {
    setToken(payload.token);
    setProfile(payload.profile);
    localStorage.setItem('huicloud-token', payload.token);
    localStorage.setItem('huicloud-profile', JSON.stringify(payload.profile));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    localStorage.removeItem('huicloud-token');
    localStorage.removeItem('huicloud-profile');
  }, []);

  const [cartItems, setCartItems] = useState(() => readLocal('huicloud-cart', []));
  const updateCartState = useCallback((updater) => {
    setCartItems((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const next = typeof updater === 'function' ? updater(base) : updater;
      const normalized = Array.isArray(next) ? next : [];
      localStorage.setItem('huicloud-cart', JSON.stringify(normalized));
      return normalized;
    });
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    updateCartState((prev) => {
      const list = [...prev];
      const index = list.findIndex((item) => item.id === product.id);
      if (index > -1) {
        list[index] = { ...list[index], quantity: list[index].quantity + quantity };
      } else {
        list.push({ id: product.id, quantity, product });
      }
      return list;
    });
  }, [updateCartState]);

  const removeFromCart = useCallback((id) => {
    updateCartState((prev) => prev.filter((item) => item.id !== id));
  }, [updateCartState]);

  const updateCart = useCallback((id, quantity) => {
    updateCartState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  }, [updateCartState]);

  const clearCart = useCallback(() => updateCartState([]), [updateCartState]);

  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'info') => {
    setToasts((items) => {
      const toast = { id: crypto.randomUUID(), message, tone };
      return [...items, toast];
    });
  }, []);

  const remove = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const sidebarValue = useMemo(() => ({ isOpen: isSidebarOpen, toggle: toggleSidebar, close: closeSidebar }), [isSidebarOpen, toggleSidebar, closeSidebar]);
  const authValue = useMemo(() => ({ token, profile, login, logout }), [token, profile, login, logout]);
  const toastValue = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);
  const cartValue = useMemo(
    () => ({
      items: cartItems,
      add: addToCart,
      remove: removeFromCart,
      update: updateCart,
      clear: clearCart
    }),
    [cartItems, addToCart, removeFromCart, updateCart, clearCart]
  );

  return (
    <SidebarContext.Provider value={sidebarValue}>
      <AuthContext.Provider value={authValue}>
        <CartContext.Provider value={cartValue}>
          <ToastContext.Provider value={toastValue}>
            {children}
            <div className="toast-container">
              {toasts.map((toast) => (
                <div key={toast.id} className="toast" role="status" onAnimationEnd={() => remove(toast.id)}>
                  {toast.message}
                </div>
              ))}
            </div>
          </ToastContext.Provider>
        </CartContext.Provider>
      </AuthContext.Provider>
    </SidebarContext.Provider>
  );
};
