import { z } from "zod";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, products, orderItems } from "@db/schema";

export const analyticsRouter = createRouter({
  dashboard: adminQuery.query(async () => {
    const db = getDb();

    const revenueResult = await db
      .select({ total: sql<number>`COALESCE(sum(total), 0)` })
      .from(orders);

    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, today));

    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "received"));

    const lowStockResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`stockQuantity < 10`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await db
      .select({
        date: sql<string>`date(createdAt)`,
        revenue: sql<number>`COALESCE(sum(total), 0)`,
        orders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo))
      .groupBy(sql`date(createdAt)`)
      .orderBy(sql`date(createdAt)`);

    return {
      totalRevenue: revenueResult[0]?.total ?? 0,
      totalOrders: totalOrdersResult[0]?.count ?? 0,
      todayOrders: todayOrdersResult[0]?.count ?? 0,
      pendingOrders: pendingOrdersResult[0]?.count ?? 0,
      lowStockCount: lowStockResult[0]?.count ?? 0,
      salesChart: salesData,
    };
  }),

  salesByPeriod: adminQuery
    .input(
      z.object({
        start: z.string(),
        end: z.string(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { start, end } = input;

      const salesData = await db
        .select({
          period: sql<string>`date(createdAt)`,
          revenue: sql<number>`COALESCE(sum(total), 0)`,
          orders: sql<number>`count(*)`,
        })
        .from(orders)
        .where(
          and(
            sql`${orders.createdAt} >= ${new Date(start).toISOString()}`,
            sql`${orders.createdAt} <= ${new Date(end).toISOString()}`
          )
        )
        .groupBy(sql`date(createdAt)`)
        .orderBy(sql`date(createdAt)`);

      return salesData;
    }),

  revenueByCategory: adminQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select({
        category: products.category,
        revenue: sql<number>`COALESCE(sum(${orderItems.totalPrice}), 0)`,
        units: sql<number>`COALESCE(sum(${orderItems.quantity}), 0)`,
        orders: sql<number>`count(distinct ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .groupBy(products.category);
    return items;
  }),

  repeatCustomerRate: adminQuery.query(async () => {
    const db = getDb();
    const allCustomers = await db
      .select({
        email: orders.shippingEmail,
        orders: sql<number>`count(*)`,
        total: sql<number>`COALESCE(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(sql`${orders.status} != 'cancelled'`)
      .groupBy(orders.shippingEmail);

    const totalCustomers = allCustomers.length;
    const repeatCustomers = allCustomers.filter((c) => c.orders > 1).length;
    const rate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      repeatCustomers,
      rate: Math.round(rate * 10) / 10,
      oneTimeCustomers: totalCustomers - repeatCustomers,
    };
  }),

  aovOverTime: adminQuery
    .input(
      z.object({
        months: z.number().default(6),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const months = input?.months ?? 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const data = await db
        .select({
          month: sql<string>`strftime('%Y-%m', ${orders.createdAt})`,
          aov: sql<number>`COALESCE(avg(${orders.total}), 0)`,
          orders: sql<number>`count(*)`,
          revenue: sql<number>`COALESCE(sum(${orders.total}), 0)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            sql`${orders.status} != 'cancelled'`
          )
        )
        .groupBy(sql`strftime('%Y-%m', ${orders.createdAt})`)
        .orderBy(sql`strftime('%Y-%m', ${orders.createdAt})`);

      return data;
    }),

  topCustomers: adminQuery
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;

      const customers = await db
        .select({
          email: orders.shippingEmail,
          name: orders.shippingName,
          orders: sql<number>`count(*)`,
          total: sql<number>`COALESCE(sum(${orders.total}), 0)`,
          lastOrder: sql<string>`max(date(${orders.createdAt}))`,
        })
        .from(orders)
        .where(sql`${orders.status} != 'cancelled'`)
        .groupBy(orders.shippingEmail)
        .orderBy(desc(sql`sum(${orders.total})`))
        .limit(limit);

      return customers;
    }),
});
