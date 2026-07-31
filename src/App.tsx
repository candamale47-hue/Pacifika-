import { useState } from "react";
import { Routes, Route } from "react-router";
import { CartProvider } from "./lib/cart-context";
import { useAnalytics } from "./hooks/useAnalytics";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import WishlistPage from "./pages/WishlistPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ReturnsPage from "./pages/ReturnsPage";
import ContactPage from "./pages/ContactPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Lookbook from "./pages/Lookbook";
import BottomNav from "./components/BottomNav";
import MiniCart from "./components/MiniCart";
import { PushNotificationContainer } from "./components/PushNotifications";
import { ErrorBoundary } from "./components/ErrorBoundary";

function AnalyticsInit() {
  useAnalytics();
  return null;
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartProvider>
      <AnalyticsInit />
      <PushNotificationContainer />
      <div className="min-h-screen bg-[#0F1923] text-[#F0EDE6] max-w-lg mx-auto relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:slug" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track" element={<OrderTracking />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/lookbook" element={<Lookbook />} />
        </Routes>
        <BottomNav onOpenCart={() => setCartOpen(true)} />
        <MiniCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </CartProvider>
  );
}
