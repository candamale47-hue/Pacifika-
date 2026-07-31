/**
 * Google Analytics 4 E-Commerce Tracking
 * Loads gtag.js dynamically and fires e-commerce events.
 */

let gaLoaded = false;

function loadGtag(measurementId: string) {
  if (gaLoaded) return;
  gaLoaded = true;

  // Inject gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  (window as unknown as Record<string, unknown>).dataLayer =
    (window as unknown as Record<string, unknown[]>).dataLayer || [];

  function gtag(...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer.push(args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag = gtag;

  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false, // We handle page views manually for SPA
    currency: "AUD",
  });
}

/**
 * Initialize GA with a Measurement ID (e.g., "G-XXXXXXXXXX")
 */
export function initAnalytics(measurementId: string) {
  if (!measurementId || measurementId === "G-XXXXXXXXXX") return;
  loadGtag(measurementId);
}

/**
 * Get the gtag function
 */
function getGtag(): ((...args: unknown[]) => void) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).gtag || null;
}

/**
 * Track a page view (manual for SPA navigation)
 */
export function trackPageView(pageTitle: string, pagePath: string) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "page_view", {
    page_title: pageTitle,
    page_location: window.location.origin + pagePath,
    page_path: pagePath,
  });
}

/**
 * Track a product view
 */
export function trackViewItem(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "view_item", {
    currency: "AUD",
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1,
    }],
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  size?: string;
}) {
  const gtag = getGtag();
  if (!gtag) return;
  const item: Record<string, unknown> = {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    price: product.price,
    quantity: product.quantity,
  };
  if (product.size) item.item_variant = product.size;
  gtag("event", "add_to_cart", {
    currency: "AUD",
    value: product.price * product.quantity,
    items: [item],
  });
}

/**
 * Track view cart
 */
export function trackViewCart(items: Array<{
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}>, total: number) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "view_cart", {
    currency: "AUD",
    value: total,
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      item_category: i.category,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(items: Array<{
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}>, total: number) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "begin_checkout", {
    currency: "AUD",
    value: total,
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      item_category: i.category,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

/**
 * Track purchase
 */
export function trackPurchase(order: {
  orderId: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  items: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
}) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "purchase", {
    transaction_id: order.orderId,
    value: order.total,
    currency: "AUD",
    tax: 0,
    shipping: order.shipping,
    ...(order.discount ? { discount: order.discount } : {}),
    items: order.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      item_category: i.category,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

/**
 * Track promo code applied
 */
export function trackPromoCode(code: string, discount: number) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "apply_promo", {
    code,
    discount_value: discount,
    currency: "AUD",
  });
}

/**
 * Track search
 */
export function trackSearch(term: string) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "search", { search_term: term });
}

/**
 * Track product shared on Facebook
 */
export function trackShare(productId: string, method = "Facebook") {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "share", {
    method,
    content_type: "product",
    item_id: productId,
  });
}

/**
 * Track admin login
 */
export function trackAdminLogin() {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "admin_login");
}
