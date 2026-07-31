import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { waitlist, products } from "@db/schema";

export const waitlistRouter = createRouter({
  subscribe: publicQuery
    .input(z.object({ email: z.string().email(), productId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(waitlist)
        .where(and(eq(waitlist.email, input.email), eq(waitlist.productId, input.productId)))
        .get();

      if (existing) {
        return { success: true, message: "Already on the waitlist!" };
      }

      await db.insert(waitlist).values({
        email: input.email,
        productId: input.productId,
      });

      return { success: true, message: "Added to waitlist!" };
    }),

  adminList: adminQuery
    .query(async () => {
      const db = getDb();
      const rows = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));

      const enriched = await Promise.all(
        rows.map(async (row) => {
          const product = await db
            .select({ name: products.name, stockQuantity: products.stockQuantity })
            .from(products)
            .where(eq(products.id, row.productId))
            .limit(1);
          return { ...row, productName: product[0]?.name ?? "Unknown", productStock: product[0]?.stockQuantity ?? 0 };
        })
      );

      return enriched;
    }),

  countForProduct: adminQuery
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(waitlist)
        .where(and(eq(waitlist.productId, input.productId), eq(waitlist.notified, false)));
      return rows.length;
    }),

  markNotified: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(waitlist).set({ notified: true }).where(eq(waitlist.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(waitlist).where(eq(waitlist.id, input.id));
      return { success: true };
    }),
});
