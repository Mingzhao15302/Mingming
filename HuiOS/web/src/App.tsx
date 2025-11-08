import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import VideoBrowserPage from './pages/VideoBrowserPage'
import ShopHomePage from './pages/ShopHomePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import ConsolePage from './pages/ConsolePage'

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Layout sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen((s) => !s)}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/videos" element={<VideoBrowserPage />} />
        <Route path="/shop" element={<ShopHomePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/console" element={<ConsolePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
