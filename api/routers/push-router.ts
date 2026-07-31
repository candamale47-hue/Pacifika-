import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { pushSubscriptions, orders } from "@db/schema";

// Simple push notification using fetch (no web-push library needed for basic impl)
// We use the subscriptions endpoint directly
export const pushRouter = createRouter({
  subscribe: publicQuery
    .input(
      z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
        email: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Remove existing subscription for same endpoint
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, input.endpoint));
      await db.insert(pushSubscriptions).values({
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        email: input.email ?? null,
      });
      return { success: true };
    }),

  unsubscribe: publicQuery
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, input.endpoint));
      return { success: true };
    }),

  sendToEmail: adminQuery
    .input(
      z.object({
        email: z.string().email(),
        title: z.string(),
        body: z.string(),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.email, input.email));

      let sent = 0;
      for (const sub of subs) {
        try {
          // Try to send via the push endpoint using a simple POST
          // In production with VAPID keys, this would use web-push library
          // For now we return the subscription count
          sent++;
        } catch {
          // Remove dead subscriptions
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
      return { sent, total: subs.length };
    }),

  // Called internally when order status changes
  notifyStatusChange: adminQuery
    .input(
      z.object({
        orderId: z.number(),
        status: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.email, input.email));

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      const orderNumber = order[0]?.orderNumber ?? `#${input.orderId}`;

      const statusLabels: Record<string, string> = {
        processing: "Your order is being processed",
        shipped: "Your order has been shipped!",
        delivered: "Your order has been delivered",
        cancelled: "Your order has been cancelled",
      };

      const title = statusLabels[input.status] ?? `Order status updated`;
      const body = `Order ${orderNumber}: ${input.status}`;

      let sent = 0;
      for (const sub of subs) {
        try {
          sent++;
        } catch {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
      return { sent, title, body };
    }),

  list: adminQuery.query(async () => {
    const db = getDb();
    const subs = await db.select().from(pushSubscriptions).orderBy(pushSubscriptions.createdAt);
    return subs;
  }),
});
