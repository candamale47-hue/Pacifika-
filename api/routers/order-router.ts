import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, orderItems, products, orderStatusHistory } from "@db/schema";
import { eq, desc, asc, and, or, like, sql, count, gte, inArray } from "drizzle-orm";
import { sendOrderConfirmationCustomer, sendOrderNotificationAdmin, sendStatusUpdateEmail, sendOrderCancellationAdmin, CUSTOMER_STATUS_EMAIL_STATUSES } from "../lib/email";

const db = getDb();

async function notifyCustomerOrderStatus(orderId: number, status: string, note?: string) {
  if (!CUSTOMER_STATUS_EMAIL_STATUSES.has(status)) return;

  const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!orderResult[0]?.shippingEmail) return;

  const itemsResult = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const order = orderResult[0];
  await sendStatusUpdateEmail(
    {
      orderNumber: order.orderNumber,
      status,
      shippingName: order.shippingName,
      shippingEmail: order.shippingEmail,
      trackingNumber: order.trackingNumber,
    },
    itemsResult.map((item) => ({
      productName: item.productName,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    note,
  );
}

// ── Server-side helpers ───────────────────────────────────────────────

function calculateShipping(country: string, subtotal: number, deliveryMethod: string, postcode: string): number {
  // Free local delivery for Cairns (4870)
  if (deliveryMethod === "free_local" || postcode === "4870") return 0;
  // Click & Collect
  if (deliveryMethod === "click_collect") return 0;
  // Australia standard
  if (country === "Australia") return subtotal >= 100 ? 0 : 9.99;
  // New Zealand
  if (country === "New Zealand") return 19.99;
  // Rest of world
  return 29.99;
}

function calculateGst(subtotal: number): number {
  return Math.round((subtotal / 11) * 100) / 100;
}

// ── Router ────────────────────────────────────────────────────────────

export const orderRouter = createRouter({
  // ── CREATE ORDER (Security Hardened) ───────────────────────────────
  create: publicQuery
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1).max(99),
        size: z.string().optional(),
        color: z.string().optional(),
      })).min(1),
      shipping: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        address1: z.string().min(1),
        address2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        postcode: z.string().min(1),
        country: z.string().default("Australia"),
      }),
      deliveryMethod: z.enum(["standard_shipping", "express_shipping", "click_collect", "free_local"]).default("standard_shipping"),
      deliveryInstructions: z.string().optional(),
      preferredPickupTime: z.string().optional(),
      customerNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // SECURITY: Fetch ALL product prices from DB - never trust client
      const itemDetails = await Promise.all(
        input.items.map(async (item) => {
          const product = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (!product[0]) {
            throw new Error(`Product ${item.productId} not found`);
          }
          if (!product[0].price || Number(product[0].price) <= 0) {
            throw new Error(`Invalid price for product ${item.productId}`);
          }

          return {
            ...item,
            unitPrice: Number(product[0].price),
            totalPrice: Number(product[0].price) * item.quantity,
            productName: product[0].name,
          };
        })
      );

      // SECURITY: Check stock availability
      for (const item of itemDetails) {
        const product = await db
          .select({ stockQuantity: products.stockQuantity })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        const stock = product[0]?.stockQuantity ?? 0;
        if (stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${stock}, Requested: ${item.quantity}`);
        }
      }

      // SECURITY: Deduct stock
      for (const item of itemDetails) {
        await db.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      // SECURITY: Recalculate totals server-side
      const subtotal = itemDetails.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryMethod = input.deliveryMethod || "standard_shipping";
      if (deliveryMethod === "free_local" && input.shipping.postcode !== "4870") throw new Error("Free local delivery only available for postcode 4870");
      if (deliveryMethod === "click_collect" && input.shipping.postcode !== "4870") throw new Error("Click & Collect only available for postcode 4870");
      const shippingCost = calculateShipping(input.shipping.country, subtotal, deliveryMethod, input.shipping.postcode);
      const gst = calculateGst(subtotal);
      const total = Math.round((subtotal + shippingCost) * 100) / 100;

      if (subtotal < 0 || shippingCost < 0 || total < 0) {
        throw new Error("Invalid calculation result");
      }

      const orderNumber = `PW${Date.now().toString(36).toUpperCase()}`;

      const [order] = await db.insert(orders).values({
        orderNumber,
        status: "pending_payment",
        paymentMethod: "square",
        paymentReference: null,
        shippingName: input.shipping.name,
        shippingEmail: input.shipping.email,
        shippingPhone: input.shipping.phone || null,
        shippingAddress1: input.shipping.address1,
        shippingAddress2: input.shipping.address2 || null,
        shippingCity: input.shipping.city,
        shippingState: input.shipping.state,
        shippingPostcode: input.shipping.postcode,
        shippingCountry: input.shipping.country,
        subtotal,
        shippingCost,
        discountAmount: 0,
        total,
        customerNotes: input.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      await Promise.all(
        itemDetails.map((item) =>
          db.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            size: item.size || null,
            color: item.color || null,
          })
        )
      );

      return {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total,
          status: order.status,
        },
        serverCalculated: { subtotal, shippingCost, gst, total },
      };
    }),

  // ── VERIFY SQUARE PAYMENT ──────────────────────────────────────────
  verifyPayment: publicQuery
    .input(z.object({
      orderId: z.number(),
      squarePaymentId: z.string().min(1),
      amount: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!orderResult[0]) throw new Error("Order not found");

      const order = orderResult[0];

      // Already paid — do not charge emails again
      if (order.status !== "pending_payment") {
        return { success: true, orderNumber: order.orderNumber };
      }

      const expectedAmount = Math.round(order.total * 100);
      const receivedAmount = Math.round(input.amount * 100);

      if (expectedAmount !== receivedAmount) {
        throw new Error("Payment amount does not match order total. Possible tampering detected.");
      }

      await db.update(orders)
        .set({
          status: "received",
          paymentReference: input.squarePaymentId,
          paymentMethod: "square",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      // Send order confirmation emails (do not fail payment if email fails)
      try {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, input.orderId));
        const emailOrder = { ...order, status: "received" as const };
        await sendOrderConfirmationCustomer(emailOrder, items);
        await sendOrderNotificationAdmin(emailOrder, items);
      } catch (emailErr) {
        console.error("[Verify Payment] Email failed:", emailErr);
      }

      return { success: true, orderNumber: order.orderNumber };
    }),

  // ── GET ORDER ──────────────────────────────────────────────────────
  getByNumber: publicQuery
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, input.orderNumber))
        .limit(1);

      if (!orderResult[0]) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderResult[0].id));

      return { ...orderResult[0], items };
    }),

  // ── LIST ORDERS (admin) ────────────────────────────────────────────
  list: publicQuery
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
      sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc", "name_asc"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (input?.status) conditions.push(eq(orders.status, input.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const orderResult = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: count() }).from(orders).where(whereClause);

      return { orders: orderResult, total: countResult[0]?.count ?? 0, page, limit };
    }),

  // ── ADMIN LIST (search + sort) ─────────────────────────────────────
  getAdminList: publicQuery
    .input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc", "name_asc"]).optional(),
      page: z.number().default(1).optional(),
      limit: z.number().default(100).optional(),
    }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 100;
      const offset = (page - 1) * limit;
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(orders.status, input.status as any));
      }
      if (input?.search?.trim()) {
        const q = `%${input.search.trim()}%`;
        conditions.push(
          or(
            like(orders.orderNumber, q),
            like(orders.shippingName, q),
            like(orders.shippingEmail, q),
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const sort = input?.sort ?? "date_desc";
      const orderBy =
        sort === "date_asc" ? asc(orders.createdAt) :
        sort === "amount_desc" ? desc(orders.total) :
        sort === "amount_asc" ? asc(orders.total) :
        sort === "name_asc" ? asc(orders.shippingName) :
        desc(orders.createdAt);

      const orderResult = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: count() }).from(orders).where(whereClause);

      return { orders: orderResult, total: countResult[0]?.count ?? 0, page, limit };
    }),

  // ── ADMIN DETAIL ───────────────────────────────────────────────────
  getAdminDetail: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!orderResult[0]) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.id));

      const statusHistory = await db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, input.id))
        .orderBy(asc(orderStatusHistory.createdAt));

      return { ...orderResult[0], items, statusHistory };
    }),

  // ── SET TRACKING ───────────────────────────────────────────────────
  setTracking: publicQuery
    .input(z.object({
      id: z.number(),
      trackingNumber: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      await db.update(orders)
        .set({ trackingNumber: input.trackingNumber, updatedAt: new Date() })
        .where(eq(orders.id, input.id));
      return { success: true };
    }),

  // ── SET ADMIN NOTES ────────────────────────────────────────────────
  setAdminNotes: publicQuery
    .input(z.object({
      id: z.number(),
      adminNotes: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.update(orders)
        .set({ adminNotes: input.adminNotes, updatedAt: new Date() })
        .where(eq(orders.id, input.id));
      return { success: true };
    }),

  // ── CHART DATA (dashboard) ─────────────────────────────────────────
  chartData: publicQuery
    .input(z.object({ days: z.number().min(1).max(365).default(30) }).optional())
    .query(async ({ input }) => {
      const days = input?.days ?? 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);

      const recentOrders = await db
        .select()
        .from(orders)
        .where(gte(orders.createdAt, since));

      const paid = recentOrders.filter(
        (o) => o.status !== "cancelled" && o.status !== "pending_payment"
      );

      const dailyMap: Record<string, { date: string; revenue: number; orderCount: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = { date: key, revenue: 0, orderCount: 0 };
      }

      for (const o of paid) {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        if (!dailyMap[key]) dailyMap[key] = { date: key, revenue: 0, orderCount: 0 };
        dailyMap[key].revenue += Number(o.total);
        dailyMap[key].orderCount += 1;
      }

      const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
      const totalRevenue = paid.reduce((s, o) => s + Number(o.total), 0);
      const totalOrders = paid.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const orderIds = paid.map((o) => o.id);
      const items = orderIds.length
        ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
        : [];

      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const item of items) {
        const key = item.productName;
        if (!productSales[key]) productSales[key] = { name: item.productName, quantity: 0, revenue: 0 };
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += Number(item.totalPrice);
      }

      return {
        daily: daily.map((d) => ({
          ...d,
          revenue: Math.round(d.revenue * 100) / 100,
        })),
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        },
        topProducts: Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((p) => ({
            name: p.name,
            quantity: p.quantity,
            revenue: Math.round(p.revenue * 100) / 100,
          })),
      };
    }),

  // ── UPDATE STATUS ──────────────────────────────────────────────────
  updateStatus: publicQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["received", "processing", "shipped", "delivered", "cancelled", "pending_payment"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(orders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(orders.id, input.id));

      // ── Send status update email (skip "received" — already sent at payment) ──
      try {
        await notifyCustomerOrderStatus(input.id, input.status, input.note);
        if (input.status === "cancelled") {
          const orderResult = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
          if (orderResult[0]) await sendOrderCancellationAdmin(orderResult[0]);
        }
      } catch (emailErr) {
        console.error("[Update Status] Email failed:", emailErr);
      }

      return { success: true };
    }),

  // ── UPDATE DELIVERY STATUS ─────────────────────────────────────────
  updateDeliveryStatus: publicQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["packed", "ready_for_pickup", "shipped", "delivered"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      // If marking as ready for pickup, calculate 6-hour window
      if (input.status === "ready_for_pickup") {
        const readyTime = new Date();
        readyTime.setHours(readyTime.getHours() + 6);
        updateData.readyForPickupAt = readyTime;
      }

      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, input.id));

      try {
        await notifyCustomerOrderStatus(input.id, input.status, input.note);
      } catch (emailErr) {
        console.error("[Update Delivery Status] Email failed:", emailErr);
      }

      return { success: true, readyForPickupAt: updateData.readyForPickupAt };
    }),

  // ── CANCEL ORDER ───────────────────────────────────────────────────
  cancel: publicQuery
    .input(z.object({
      id: z.number().optional(),
      orderNumber: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      let orderResult;
      if (input.id != null) {
        orderResult = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
      } else if (input.orderNumber && input.email) {
        orderResult = await db
          .select()
          .from(orders)
          .where(and(eq(orders.orderNumber, input.orderNumber), eq(orders.shippingEmail, input.email)))
          .limit(1);
      } else {
        throw new Error("Provide order id or order number with email");
      }

      if (!orderResult[0]) throw new Error("Order not found");

      const order = orderResult[0];
      const cancellableStatuses = ["pending_payment", "received"];
      if (!cancellableStatuses.includes(order.status)) {
        throw new Error("Order cannot be cancelled - already processed");
      }

      await db.update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      try {
        await notifyCustomerOrderStatus(order.id, "cancelled");
        await sendOrderCancellationAdmin(order);
      } catch (emailErr) {
        console.error("[Cancel Order] Email failed:", emailErr);
      }

      return { success: true };
    }),

  // ── ANALYTICS ──────────────────────────────────────────────────────
  analytics: publicQuery.query(async () => {
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);

    const statusCounts = { received: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, pending_payment: 0 };
    for (const o of allOrders) {
      statusCounts[o.status as keyof typeof statusCounts] = (statusCounts[o.status as keyof typeof statusCounts] || 0) + 1;
    }

    const productSales: Record<number, { name: string; qty: number; revenue: number }> = {};
    for (const item of allItems) {
      if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].revenue += Number(item.totalPrice);
    }

    const totalRevenue = allOrders
      .filter(o => o.status !== "cancelled" && o.status !== "pending_payment")
      .reduce((sum, o) => sum + Number(o.total), 0);

    const activeOrders = allOrders.filter(o => o.status !== "cancelled" && o.status !== "pending_payment").length;

    return {
      statusCounts,
      productSales: Object.values(productSales).sort((a, b) => b.revenue - a.revenue),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: activeOrders,
    };
  }),

  // ── REVENUE SUMMARY ────────────────────────────────────────────────
  revenueSummary: publicQuery.query(async () => {
    const allOrders = await db.select().from(orders);
    const allItems = await db.select().from(orderItems);

    const activeOrders = allOrders.filter(o => o.status !== "cancelled" && o.status !== "pending_payment");
    const totalRevenue = activeOrders.reduce((s, o) => s + Number(o.total), 0);
    const avgOrder = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

    const productSales: Record<number, { name: string; qty: number; revenue: number }> = {};
    for (const item of allItems) {
      if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].revenue += Number(item.totalPrice);
    }

    const monthOrders = activeOrders.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total), 0);

    return {
      avgOrderValue: Math.round(avgOrder * 100) / 100,
      totalOrders: monthOrders.length,
      totalRevenue: Math.round(monthRevenue * 100) / 100,
      topProducts: Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }),

  // ── PROCESS SQUARE PAYMENT ───────────────────────────────────────────
  // This is the CRITICAL endpoint that actually charges the customer's card
  processPayment: publicQuery
    .input(z.object({
      orderId: z.number(),
      sourceId: z.string().min(1), // Square card token
      amount: z.number().positive(), // For verification
    }))
    .mutation(async ({ input }) => {
      const square = await import("square");


      const client = new square.SquareClient({
        token: "EAAAl_nKnjNvCBVLXqMktNYQSjwPClaz5kmCXdyOMHFveXbjd0m_xVHdsVPxxBFw",
        environment: square.SquareEnvironment.Sandbox,
      });

      // Fetch order to verify amount
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!orderResult[0]) throw new Error("Order not found");
      const order = orderResult[0];

      // Already paid — avoid double charge / duplicate emails
      if (order.status !== "pending_payment") {
        return {
          success: true,
          orderNumber: order.orderNumber,
          paymentId: order.paymentReference,
          amountPaid: order.total,
        };
      }

      // SECURITY: Verify payment amount matches server-calculated total
      const expectedCents = Math.round(order.total * 100);
      const receivedCents = Math.round(input.amount * 100);
      if (expectedCents !== receivedCents) {
        throw new Error("Payment amount mismatch. Tampering detected.");
      }

      // Stable key so a retry for the same order does not create a second Square charge
      const idempotencyKey = `pay-${order.id}`;
      const paymentsApi = client.payments;

      const response = await paymentsApi.create({
        sourceId: input.sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(expectedCents),
          currency: "AUD",
        },
        referenceId: order.orderNumber,
        note: `Pacifika Wear - Order ${order.orderNumber}`,
      });

      if (!response.payment) {
        throw new Error("Payment failed - no response from Square");
      }

      // Update order as paid
      await db.update(orders)
        .set({
          status: "received",
          paymentReference: response.payment.id,
          paymentMethod: "square",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      // Send order confirmation emails (do not fail payment if email fails)
      try {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, input.orderId));
        const emailOrder = { ...order, status: "received" as const };
        await sendOrderConfirmationCustomer(emailOrder, items);
        await sendOrderNotificationAdmin(emailOrder, items);
      } catch (emailErr) {
        console.error("[Process Payment] Email failed:", emailErr);
      }

      return {
        success: true,
        orderNumber: order.orderNumber,
        paymentId: response.payment.id,
        amountPaid: order.total,
      };
    }),
});
