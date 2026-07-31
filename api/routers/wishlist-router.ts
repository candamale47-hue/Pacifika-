import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { wishlist, products } from "@db/schema";

export const wishlistRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.number().optional(), sessionId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.userId
        ? and(eq(wishlist.userId, input.userId))
        : input.sessionId
          ? and(eq(wishlist.sessionId, input.sessionId))
          : undefined;

      const rows = await db.select().from(wishlist).where(where).orderBy(desc(wishlist.createdAt));

      const enriched = await Promise.all(
        rows.map(async (row) => {
          const product = await db.select().from(products).where(eq(products.id, row.productId)).get();
          return { ...row, product: product ?? null };
        })
      );
      return enriched;
    }),

  check: publicQuery
    .input(z.object({ productId: z.number(), userId: z.number().optional(), sessionId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.userId
        ? and(eq(wishlist.userId, input.userId), eq(wishlist.productId, input.productId))
        : input.sessionId
          ? and(eq(wishlist.sessionId, input.sessionId), eq(wishlist.productId, input.productId))
          : undefined;
      if (!where) return false;
      const row = await db.select().from(wishlist).where(where).get();
      return !!row;
    }),

  toggle: publicQuery
    .input(z.object({ productId: z.number(), userId: z.number().optional(), sessionId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const where = input.userId
        ? and(eq(wishlist.userId, input.userId), eq(wishlist.productId, input.productId))
        : input.sessionId
          ? and(eq(wishlist.sessionId, input.sessionId), eq(wishlist.productId, input.productId))
          : undefined;

      if (!where) throw new Error("Need userId or sessionId");

      const existing = await db.select().from(wishlist).where(where).get();
      if (existing) {
        await db.delete(wishlist).where(eq(wishlist.id, existing.id));
        return { added: false };
      } else {
        await db.insert(wishlist).values({
          userId: input.userId ?? null,
          sessionId: input.sessionId ?? null,
          productId: input.productId,
        });
        return { added: true };
      }
    }),

  migrate: publicQuery
    .input(z.object({ userId: z.number(), sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const sessionItems = await db.select().from(wishlist).where(eq(wishlist.sessionId, input.sessionId));
      for (const item of sessionItems) {
        const existing = await db.select().from(wishlist)
          .where(and(eq(wishlist.userId, input.userId), eq(wishlist.productId, item.productId)))
          .get();
        if (!existing) {
          await db.insert(wishlist).values({
            userId: input.userId,
            productId: item.productId,
          });
        }
        await db.delete(wishlist).where(eq(wishlist.id, item.id));
      }
      return { migrated: sessionItems.length };
    }),

  remove: publicQuery
    .input(z.object({ productId: z.number(), userId: z.number().optional(), sessionId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const where = input.userId
        ? and(eq(wishlist.userId, input.userId), eq(wishlist.productId, input.productId))
        : input.sessionId
          ? and(eq(wishlist.sessionId, input.sessionId), eq(wishlist.productId, input.productId))
          : undefined;
      if (where) {
        await db.delete(wishlist).where(where);
      }
      return { removed: true };
    }),
});
