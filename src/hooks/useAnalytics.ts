import { useEffect } from "react";
import { useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { initPixel, trackPixelPageView } from "@/lib/fb-pixel";

const pageNames: Record<string, string> = {
  "/": "Home",
  "/shop": "Shop",
  "/cart": "Shopping Bag",
  "/checkout": "Checkout",
  "/orders": "My Orders",
  "/track": "Order Tracking",
  "/account": "My Account",
  "/login": "Login",
  "/admin": "Admin Dashboard",
  "/contact": "Contact Us",
  "/terms": "Terms of Service",
  "/privacy": "Privacy Policy",
  "/returns": "Return Policy",
};

export function useAnalytics() {
  const location = useLocation();
  const { data: gaIdSetting } = trpc.settings.get.useQuery(
    { key: "ga_measurement_id" },
    { retry: false }
  );
  const { data: fbPixelSetting } = trpc.settings.get.useQuery(
    { key: "fb_pixel_id" },
    { retry: false }
  );

  // Initialize GA once
  useEffect(() => {
    const id = gaIdSetting?.value;
    if (id && id !== "G-XXXXXXXXXX") {
      initAnalytics(id);
    }
  }, [gaIdSetting?.value]);

  // Initialize FB Pixel once
  useEffect(() => {
    const id = fbPixelSetting?.value;
    if (id) {
      initPixel(id);
    }
  }, [fbPixelSetting?.value]);

  // Track page views on route change
  useEffect(() => {
    const path = location.pathname;
    let title = pageNames[path];
    if (!title) {
      if (path.startsWith("/shop/")) title = "Shop Category";
      else if (path.startsWith("/product/")) title = "Product Detail";
      else title = path.slice(1) || "Home";
    }
    trackPageView(title, path + location.search);
    // FB Pixel page view
    trackPixelPageView();
  }, [location.pathname, location.search]);
}
