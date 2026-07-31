import { z } from "zod";
import { eq, sql, gte, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { funnelEvents } from "@db/schema";

export const funnelRouter = createRouter({
  // Track an event (public - anyone can submit events)
  track: publicQuery
    .input(
      z.object({
        type: z.enum(["page_view", "add_to_cart", "begin_checkout", "purchase", "view_product"]),
        sessionId: z.string().min(1),
        productId: z.number().optional(),
        orderId: z.number().optional(),
        value: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(funnelEvents).values({
        type: input.type,
        sessionId: input.sessionId,
        productId: input.productId ?? null,
        orderId: input.orderId ?? null,
        value: input.value ?? null,
      });
      return { success: true };
    }),

  // Get funnel data for admin dashboard
  getFunnel: adminQuery
    .input(
      z.object({
        days: z.number().default(30),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const days = input?.days ?? 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get unique sessions at each stage
      const pageViews = await db
        .select({ count: sql<number>`count(distinct sessionId)` })
        .from(funnelEvents)
        .where(and(eq(funnelEvents.type, "page_view"), gte(funnelEvents.createdAt, startDate)));

      const addToCarts = await db
        .select({ count: sql<number>`count(distinct sessionId)` })
        .from(funnelEvents)
        .where(and(eq(funnelEvents.type, "add_to_cart"), gte(funnelEvents.createdAt, startDate)));

      const beginCheckouts = await db
        .select({ count: sql<number>`count(distinct sessionId)` })
        .from(funnelEvents)
        .where(and(eq(funnelEvents.type, "begin_checkout"), gte(funnelEvents.createdAt, startDate)));

      const purchases = await db
        .select({
          sessions: sql<number>`count(distinct sessionId)`,
          revenue: sql<number>`COALESCE(sum(value), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(funnelEvents)
        .where(and(eq(funnelEvents.type, "purchase"), gte(funnelEvents.createdAt, startDate)));

      const pv = pageViews[0]?.count ?? 0;
      const atc = addToCarts[0]?.count ?? 0;
      const bc = beginCheckouts[0]?.count ?? 0;
      const pur = purchases[0]?.sessions ?? 0;
      const revenue = purchases[0]?.revenue ?? 0;
      const purchaseCount = purchases[0]?.count ?? 0;

      return {
        stages: [
          { name: "Shop View", count: pv, key: "page_view" },
          { name: "Add to Cart", count: atc, key: "add_to_cart", conversionRate: pv > 0 ? Math.round((atc / pv) * 1000) / 10 : 0 },
          { name: "Begin Checkout", count: bc, key: "begin_checkout", conversionRate: atc > 0 ? Math.round((bc / atc) * 1000) / 10 : 0 },
          { name: "Purchase", count: pur, key: "purchase", conversionRate: bc > 0 ? Math.round((pur / bc) * 1000) / 10 : 0 },
        ],
        overallConversion: pv > 0 ? Math.round((pur / pv) * 1000) / 10 : 0,
        totalRevenue: revenue,
        purchaseCount,
        // Drop-off at each stage
        dropOffs: [
          { from: "Shop View", to: "Add to Cart", dropped: pv - atc, rate: pv > 0 ? Math.round(((pv - atc) / pv) * 1000) / 10 : 0 },
          { from: "Add to Cart", to: "Begin Checkout", dropped: atc - bc, rate: atc > 0 ? Math.round(((atc - bc) / atc) * 1000) / 10 : 0 },
          { from: "Begin Checkout", to: "Purchase", dropped: bc - pur, rate: bc > 0 ? Math.round(((bc - pur) / bc) * 1000) / 10 : 0 },
        ],
      };
    }),

  // Get daily events for trend chart
  getTrend: adminQuery
    .input(
      z.object({
        days: z.number().default(14),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const days = input?.days ?? 14;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await db
        .select({
          date: sql<string>`date(createdAt)`,
          type: funnelEvents.type,
          count: sql<number>`count(distinct sessionId)`,
        })
        .from(funnelEvents)
        .where(gte(funnelEvents.createdAt, startDate))
        .groupBy(sql`date(createdAt)`, funnelEvents.type)
        .orderBy(sql`date(createdAt)`);

      return data;
    }),
});
