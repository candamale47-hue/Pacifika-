import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { orders, orderItems } from "@db/schema";

export const customerRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();

    // Get all unique customer emails with their order data
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    // Group by email
    const customerMap = new Map<string, {
      email: string;
      name: string;
      phone: string | null;
      totalOrders: number;
      totalSpent: number;
      firstOrder: Date | null;
      lastOrder: Date | null;
      orderIds: number[];
      orders: typeof allOrders;
    }>();

    for (const order of allOrders) {
      const key = order.shippingEmail;
      if (!key) continue;

      const existing = customerMap.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += Number(order.total);
        existing.orderIds.push(order.id);
        existing.orders.push(order);
        if (order.createdAt && (!existing.firstOrder || order.createdAt < existing.firstOrder)) {
          existing.firstOrder = order.createdAt;
        }
        if (order.createdAt && (!existing.lastOrder || order.createdAt > existing.lastOrder)) {
          existing.lastOrder = order.createdAt;
        }
      } else {
        customerMap.set(key, {
          email: key,
          name: order.shippingName ?? "Unknown",
          phone: order.shippingPhone ?? null,
          totalOrders: 1,
          totalSpent: Number(order.total),
          firstOrder: order.createdAt,
          lastOrder: order.createdAt,
          orderIds: [order.id],
          orders: [order],
        });
      }
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate total customers and total lifetime value
    const totalCustomers = customers.length;
    const totalLifetimeValue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return { customers, totalCustomers, totalLifetimeValue };
  }),

  getDetail: adminQuery
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = getDb();

      const customerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.shippingEmail, input.email))
        .orderBy(desc(orders.createdAt));

      if (customerOrders.length === 0) return null;

      const items = await db
        .select()
        .from(orderItems);

      const totalSpent = customerOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0);

      const orderItemsMap = new Map<number, typeof items>();
      for (const item of items) {
        if (!orderItemsMap.has(item.orderId)) {
          orderItemsMap.set(item.orderId, []);
        }
        orderItemsMap.get(item.orderId)!.push(item);
      }

      const enrichedOrders = customerOrders.map((o) => ({
        ...o,
        items: orderItemsMap.get(o.id) ?? [],
      }));

      return {
        email: input.email,
        name: customerOrders[0]?.shippingName ?? "Unknown",
        phone: customerOrders[0]?.shippingPhone ?? null,
        address: `${customerOrders[0]?.shippingAddress1 ?? ""}, ${customerOrders[0]?.shippingCity ?? ""} ${customerOrders[0]?.shippingState ?? ""} ${customerOrders[0]?.shippingPostcode ?? ""}`,
        totalOrders: customerOrders.length,
        totalSpent,
        firstOrder: customerOrders[customerOrders.length - 1]?.createdAt,
        lastOrder: customerOrders[0]?.createdAt,
        orders: enrichedOrders,
      };
    }),
});
