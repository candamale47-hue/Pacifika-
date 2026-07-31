/**
 * Facebook Pixel Tracking
 */

let pixelLoaded = false;

export function initPixel(pixelId: string) {
  if (!pixelId || pixelId === "" || pixelLoaded) return;
  pixelLoaded = true;

  // Inject fbq
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq.callMethod
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).fbq.callMethod.apply((window as any).fbq, arguments as unknown as [])
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).fbq.queue.push(arguments);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any)._fbq) (window as any)._fbq = (window as any).fbq;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq.push = (window as any).fbq;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq.loaded = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq.version = "2.0";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  // Initialize
  fbq("init", pixelId);
  fbq("track", "PageView");
}

function fbq(event: string, ...params: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = (window as any).fbq;
  if (f) f.apply(null, [event, ...params] as unknown as []);
}

export function trackPixelPageView() {
  fbq("track", "PageView");
}

export function trackPixelViewContent(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    content_category: product.category,
    value: product.price,
    currency: "AUD",
  });
}

export function trackPixelAddToCart(product: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}) {
  fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    content_category: product.category,
    value: product.price * product.quantity,
    currency: "AUD",
    contents: [{ id: product.id, quantity: product.quantity }],
  });
}

export function trackPixelPurchase(order: {
  orderId: string;
  total: number;
  items: Array<{ id: string; quantity: number }>;
}) {
  fbq("track", "Purchase", {
    content_ids: order.items.map((i) => i.id),
    content_type: "product",
    value: order.total,
    currency: "AUD",
    num_items: order.items.length,
    order_id: order.orderId,
    contents: order.items.map((i) => ({ id: i.id, quantity: i.quantity })),
  });
}

export function trackPixelCompleteRegistration() {
  fbq("track", "CompleteRegistration");
}
