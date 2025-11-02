import React, { useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import VideoGalleryPage from './pages/VideoGalleryPage.jsx';
import ConsolePage from './pages/ConsolePage.jsx';
import ShopHomePage from './pages/ShopHomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import FloatingCartButton from './components/FloatingCartButton.jsx';

function ProtectedRoute({ children }) {
  const { user } = useAppContext();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { cart } = useAppContext();

  const routes = useMemo(
    () => [
      { to: '/welcome', label: '欢迎页' },
      { to: '/login', label: '登录' },
      { to: '/gallery', label: '视频浏览' },
      { to: '/shop', label: '商城' },
      { to: '/cart', label: '购物车' },
      { to: '/console', label: '控制台' }
    ],
    []
  );

  return (
    <div className="app-layout" data-route={location.pathname}>
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} routes={routes} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} routes={routes} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/gallery" element={<VideoGalleryPage />} />
          <Route path="/shop" element={<ShopHomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route
            path="/console"
            element={
              <ProtectedRoute>
                <ConsolePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </main>
      <FloatingCartButton count={cart.reduce((acc, item) => acc + item.quantity, 0)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout />
      </HashRouter>
    </AppProvider>
  );
}
