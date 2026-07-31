/**
 * Funnel Event Tracker
 * Tracks customer journey stages for conversion analytics
 */

import { getSessionId } from "./push-notifications";

let trackedEvents = new Set<string>();

function getKey(type: string, id?: number): string {
  return `${type}_${id ?? "global"}`;
}

export async function trackFunnelEvent(
  type: "page_view" | "add_to_cart" | "begin_checkout" | "purchase" | "view_product",
  extras?: { productId?: number; orderId?: number; value?: number }
) {
  const key = getKey(type, extras?.productId ?? extras?.orderId);
  // Deduplicate: don't track the same event type for the same item twice per session
  if (trackedEvents.has(key)) return;
  trackedEvents.add(key);

  const sessionId = getSessionId();

  try {
    await fetch("/api/trpc/funnel.track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          type,
          sessionId,
          productId: extras?.productId,
          orderId: extras?.orderId,
          value: extras?.value,
        },
      }),
      keepalive: true,
    });
  } catch {
    // Silently fail - analytics should never break the user experience
  }
}

export function resetFunnelTracking() {
  trackedEvents = new Set<string>();
}

import { useEffect } from "react";

// Track page view on shop page load
export function useTrackShopView() {
  useEffect(() => {
    trackFunnelEvent("page_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Track product view
export function useTrackProductView(productId: number) {
  useEffect(() => {
    trackFunnelEvent("view_product", { productId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);
}

// Track add to cart
export function trackAddToCartFunnel(productId: number, value: number) {
  trackFunnelEvent("add_to_cart", { productId, value });
}

// Track begin checkout
export function trackBeginCheckout(value: number) {
  trackFunnelEvent("begin_checkout", { value });
}

// Track purchase
export function trackPurchase(orderId: number, value: number) {
  trackFunnelEvent("purchase", { orderId, value });
}
