import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  password: text("password"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  image: text("image"),
  sortOrder: integer("sortOrder").default(0),
});

export const products = sqliteTable("products", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category", { enum: ["dresses", "shirts", "puletasi", "kids"] }).notNull(),
  price: real("price").notNull(),
  salePrice: real("salePrice"),
  images: text("images", { mode: "json" }).notNull().$type<string[]>(),
  sizes: text("sizes", { mode: "json" }).notNull().$type<string[]>(),
  colors: text("colors", { mode: "json" }).$type<{ name: string; hex: string }[]>(),
  stockQuantity: integer("stockQuantity").notNull().default(0),
  sku: text("sku").unique(),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  featured: integer("featured", { mode: "boolean" }).default(false),
  badge: text("badge", { enum: ["new", "bestseller", "limited"] }),
  sizeStock: text("sizeStock"),
  weightGrams: integer("weightGrams").default(500),
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  relatedProductIds: text("relatedProductIds", { mode: "json" }).$type<number[]>(),
  videoUrls: text("videoUrls", { mode: "json" }).$type<string[]>(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
});

export const promoCodes = sqliteTable("promo_codes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
  value: real("value").notNull(),
  minOrderAmount: real("minOrderAmount").default(0),
  maxDiscount: real("maxDiscount"),
  usageLimit: integer("usageLimit"),
  usageCount: integer("usageCount").default(0),
  validFrom: integer("validFrom", { mode: "timestamp" }),
  validUntil: integer("validUntil", { mode: "timestamp" }),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  orderNumber: text("orderNumber").notNull().unique(),
  userId: integer("userId", { mode: "number" }).references(() => users.id),
  status: text("status", { enum: ["received", "processing", "packed", "ready_for_pickup", "shipped", "delivered", "cancelled", "pending_payment"] }).default("pending_payment"),
  shippingName: text("shippingName").notNull(),
  shippingEmail: text("shippingEmail").notNull(),
  shippingPhone: text("shippingPhone"),
  shippingAddress1: text("shippingAddress1").notNull(),
  shippingAddress2: text("shippingAddress2"),
  shippingCity: text("shippingCity").notNull(),
  shippingState: text("shippingState").notNull(),
  shippingPostcode: text("shippingPostcode").notNull(),
  shippingCountry: text("shippingCountry").notNull(),
  subtotal: real("subtotal").notNull(),
  shippingCost: real("shippingCost").notNull(),
  discountAmount: real("discountAmount").default(0),
  gstAmount: real("gstAmount").default(0),
  total: real("total").notNull(),
  totalInclGst: real("totalInclGst").notNull(),
  promoCodeId: integer("promoCodeId", { mode: "number" }).references(() => promoCodes.id),
  paymentReference: text("paymentReference"),
  paymentMethod: text("paymentMethod", { enum: ["bank_transfer", "cash", "square", "other"] }).default("bank_transfer"),
  trackingNumber: text("trackingNumber"),
  customerNotes: text("customerNotes"),
  adminNotes: text("adminNotes"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  orderId: integer("orderId", { mode: "number" }).notNull().references(() => orders.id),
  productId: integer("productId", { mode: "number" }).references(() => products.id),
  productName: text("productName").notNull(),
  productImage: text("productImage"),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  totalPrice: real("totalPrice").notNull(),
});

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  orderId: integer("orderId", { mode: "number" }).notNull().references(() => orders.id),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  productId: integer("productId", { mode: "number" }).notNull().references(() => products.id),
  userId: integer("userId", { mode: "number" }).references(() => users.id),
  userName: text("userName").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: integer("isApproved", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  productId: integer("productId", { mode: "number" }).notNull().references(() => products.id),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdate(() => new Date()).notNull(),
});

export const shippingRates = sqliteTable("shipping_rates", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  countryCode: text("countryCode"),
  region: text("region"),
  minWeight: integer("minWeight").default(0),
  maxWeight: integer("maxWeight"),
  rate: real("rate").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
});

export const waitlist = sqliteTable("waitlist", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  productId: integer("productId", { mode: "number" }).notNull().references(() => products.id),
  notified: integer("notified", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const addresses = sqliteTable("addresses", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postcode: text("postcode").notNull(),
  country: text("country").default("Australia").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const wishlist = sqliteTable("wishlist", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).references(() => users.id),
  sessionId: text("sessionId"),
  productId: integer("productId", { mode: "number" }).notNull().references(() => products.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  token: text("token").notNull(),
  used: integer("used", { mode: "boolean" }).default(false),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const collections = sqliteTable("collections", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sortOrder").default(0),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const collectionProducts = sqliteTable("collection_products", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  collectionId: integer("collectionId", { mode: "number" }).notNull().references(() => collections.id),
  productId: integer("productId", { mode: "number" }).notNull().references(() => products.id),
  sortOrder: integer("sortOrder").default(0),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email"),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const reviewReplies = sqliteTable("review_replies", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  reviewId: integer("reviewId", { mode: "number" }).notNull().references(() => reviews.id),
  reply: text("reply").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const funnelEvents = sqliteTable("funnel_events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["page_view", "add_to_cart", "begin_checkout", "purchase", "view_product"] }).notNull(),
  sessionId: text("sessionId").notNull(),
  productId: integer("productId"),
  orderId: integer("productId"),
  value: real("value"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const lookbookItems = sqliteTable("lookbook_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  image: text("image").notNull(),
  productIds: text("productIds", { mode: "json" }).$type<number[]>(),
  sortOrder: integer("sortOrder").default(0),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  group: text("group").default("general"),
});
