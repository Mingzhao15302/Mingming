import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { WelcomePage } from '../pages/WelcomePage';
import { LoginPage } from '../pages/LoginPage';
import { GalleryPage } from '../pages/GalleryPage';
import { ConsolePage } from '../pages/ConsolePage';
import { ShopHomePage } from '../pages/ShopHomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderSuccessPage } from '../pages/OrderSuccessPage';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useState } from 'react';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '2rem',
          padding: '80px clamp(1.5rem, 4vw, 3rem)',
        }}
      >
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <WelcomePage />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <LoginPage />
            </Layout>
          }
        />
        <Route
          path="/gallery"
          element={
            <Layout>
              <GalleryPage />
            </Layout>
          }
        />
        <Route
          path="/console"
          element={
            <Layout>
              <RequireAuth>
                <ConsolePage />
              </RequireAuth>
            </Layout>
          }
        />
        <Route
          path="/shop"
          element={
            <Layout>
              <ShopHomePage />
            </Layout>
          }
        />
        <Route
          path="/product/:id"
          element={
            <Layout>
              <ProductDetailPage />
            </Layout>
          }
        />
        <Route
          path="/cart"
          element={
            <Layout>
              <CartPage />
            </Layout>
          }
        />
        <Route
          path="/checkout"
          element={
            <Layout>
              <CheckoutPage />
            </Layout>
          }
        />
        <Route
          path="/success"
          element={
            <Layout>
              <OrderSuccessPage />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
