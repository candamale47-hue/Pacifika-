import { z } from "zod";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { lookbookItems, products } from "@db/schema";

export const lookbookRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(lookbookItems)
      .where(eq(lookbookItems.isActive, true))
      .orderBy(asc(lookbookItems.sortOrder));
    return items;
  }),

  adminList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(lookbookItems).orderBy(desc(lookbookItems.createdAt));
  }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        image: z.string().min(1),
        productIds: z.array(z.number()).optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(lookbookItems).values({
        title: input.title,
        description: input.description ?? null,
        image: input.image,
        productIds: input.productIds ?? null,
        sortOrder: input.sortOrder,
      });
      const inserted = await db.select().from(lookbookItems).where(eq(lookbookItems.id, Number(result.lastInsertRowid))).limit(1);
      return inserted[0];
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        productIds: z.array(z.number()).optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(lookbookItems).set(data).where(eq(lookbookItems.id, id));
      const updated = await db.select().from(lookbookItems).where(eq(lookbookItems.id, id)).limit(1);
      return updated[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(lookbookItems).where(eq(lookbookItems.id, input.id));
      return { success: true };
    }),
});
