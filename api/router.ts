import { authRouter } from "./auth-router";
import { createRouter } from "./middleware";
import { productRouter } from "./routers/product-router";
import { cartRouter } from "./routers/cart-router";
import { orderRouter } from "./routers/order-router";
import { reviewRouter } from "./routers/review-router";
import { promoRouter } from "./routers/promo-router";
import { shippingRouter } from "./routers/shipping-router";
import { analyticsRouter } from "./routers/analytics-router";
import { settingsRouter } from "./routers/settings-router";
import { localAuthRouter } from "./routers/local-auth-router";
import { wishlistRouter } from "./routers/wishlist-router";
import { newsletterRouter } from "./routers/newsletter-router";
import { waitlistRouter } from "./routers/waitlist-router";
import { addressRouter } from "./routers/address-router";
import { customerRouter } from "./routers/customer-router";
import { collectionRouter } from "./routers/collection-router";
import { pushRouter } from "./routers/push-router";
import { funnelRouter } from "./routers/funnel-router";
import { lookbookRouter } from "./routers/lookbook-router";

export const appRouter = createRouter({
  auth: authRouter,
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  review: reviewRouter,
  promo: promoRouter,
  shipping: shippingRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
  localAuth: localAuthRouter,
  wishlist: wishlistRouter,
  newsletter: newsletterRouter,
  waitlist: waitlistRouter,
  address: addressRouter,
  customer: customerRouter,
  collection: collectionRouter,
  push: pushRouter,
  funnel: funnelRouter,
  lookbook: lookbookRouter,
});

export type AppRouter = typeof appRouter;