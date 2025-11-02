import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Gallery from '../pages/Gallery';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Success from '../pages/Success';
import ConsolePage from '../pages/Console';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />, 
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'gallery', element: <Gallery /> },
      { path: 'shop', element: <Shop /> },
      { path: 'products/:id', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'success', element: <Success /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'console', element: <ConsolePage /> }],
      },
      {
        path: '*',
        element: (
          <div className="glass-card mx-auto mt-16 max-w-xl p-12 text-center">
            <h2 className="mb-4 text-3xl font-semibold">页面未找到</h2>
            <p className="text-white/70">请检查链接或返回首页继续浏览。</p>
          </div>
        ),
      },
    ],
  },
]);

export default router;
