import React, { useEffect, useMemo, useState } from 'react';
import { AppProvider } from './context/app-context.jsx';
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
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';

const ROUTES = {
  '#/welcome': WelcomePage,
  '#/login': LoginPage,
  '#/gallery': VideoGalleryPage,
  '#/console': ConsolePage,
  '#/shop': ShopHomePage,
  '#/product': ProductDetailPage,
  '#/cart': CartPage,
  '#/checkout': CheckoutPage,
  '#/success': OrderSuccessPage
};

const DEFAULT_ROUTE = '#/welcome';

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || DEFAULT_ROUTE);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = DEFAULT_ROUTE;
    }
    const handler = () => {
      setHash(window.location.hash || DEFAULT_ROUTE);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return [hash, (nextHash) => {
    window.location.hash = nextHash;
  }];
}

export default function App() {
  const [hash, navigate] = useHashRoute();
  const PageComponent = useMemo(() => {
    const [path] = hash.split('?');
    return ROUTES[path] || WelcomePage;
  }, [hash]);

  const routeParams = useMemo(() => {
    const [, query = ''] = hash.split('?');
    const search = new URLSearchParams(query);
    return Object.fromEntries(search.entries());
  }, [hash]);

  return (
    <AppProvider navigate={navigate} currentHash={hash}>
      <div className="app-shell" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <PageComponent params={routeParams} />
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
