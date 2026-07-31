import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { newsletterSubscribers } from "@db/schema";

export const newsletterRouter = createRouter({
  subscribe: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, input.email)).get();
      if (existing) return { success: true, message: "Already subscribed!" };

      await db.insert(newsletterSubscribers).values({ email: input.email });
      return { success: true, message: "Subscribed successfully!" };
    }),

  list: adminQuery
    .query(async () => {
      const db = getDb();
      const rows = await db.select().from(newsletterSubscribers);
      return rows;
    }),

  count: adminQuery
    .query(async () => {
      const db = getDb();
      const rows = await db.select().from(newsletterSubscribers);
      return rows.length;
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, input.id));
      return { success: true };
    }),
});
