import { z } from "zod";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { collections, collectionProducts, products } from "@db/schema";

export const collectionRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(collections)
      .where(eq(collections.isActive, true))
      .orderBy(asc(collections.sortOrder));

    // Get product count for each
    const counts = await db
      .select({
        collectionId: collectionProducts.collectionId,
        count: sql<number>`count(*)`,
      })
      .from(collectionProducts)
      .groupBy(collectionProducts.collectionId);

    const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

    return items.map((c) => ({
      ...c,
      productCount: countMap.get(c.id) ?? 0,
    }));
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const collection = await db
        .select()
        .from(collections)
        .where(and(eq(collections.slug, input.slug), eq(collections.isActive, true)))
        .limit(1);

      if (!collection[0]) return null;

      const links = await db
        .select()
        .from(collectionProducts)
        .where(eq(collectionProducts.collectionId, collection[0].id))
        .orderBy(asc(collectionProducts.sortOrder));

      const productIds = links.map((l) => l.productId);
      if (productIds.length === 0) {
        return { ...collection[0], products: [] };
      }

      const items = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      // Sort by collection order
      const orderMap = new Map(links.map((l) => [l.productId, l.sortOrder ?? 0]));
      items.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

      return { ...collection[0], products: items };
    }),

  adminList: adminQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(collections)
      .orderBy(desc(collections.createdAt));

    const counts = await db
      .select({
        collectionId: collectionProducts.collectionId,
        count: sql<number>`count(*)`,
      })
      .from(collectionProducts)
      .groupBy(collectionProducts.collectionId);

    const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

    return items.map((c) => ({
      ...c,
      productCount: countMap.get(c.id) ?? 0,
    }));
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(collections).values(input);
      const inserted = await db
        .select()
        .from(collections)
        .where(eq(collections.id, Number(result.lastInsertRowid)))
        .limit(1);
      return inserted[0];
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(collections).set(data).where(eq(collections.id, id));
      const updated = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
      return updated[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, input.id));
      await db.delete(collections).where(eq(collections.id, input.id));
      return { success: true };
    }),

  addProduct: adminQuery
    .input(z.object({ collectionId: z.number(), productId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(collectionProducts).values(input);
      return { success: true };
    }),

  removeProduct: adminQuery
    .input(z.object({ collectionId: z.number(), productId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(collectionProducts)
        .where(
          and(
            eq(collectionProducts.collectionId, input.collectionId),
            eq(collectionProducts.productId, input.productId)
          )
        );
      return { success: true };
    }),

  setProducts: adminQuery
    .input(
      z.object({
        collectionId: z.number(),
        productIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Remove existing
      await db
        .delete(collectionProducts)
        .where(eq(collectionProducts.collectionId, input.collectionId));
      // Add new
      for (let i = 0; i < input.productIds.length; i++) {
        await db.insert(collectionProducts).values({
          collectionId: input.collectionId,
          productId: input.productIds[i],
          sortOrder: i,
        });
      }
      return { success: true };
    }),
});
