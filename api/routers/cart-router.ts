import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { cartItems, products } from "@db/schema";

export const cartRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const items = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, ctx.user.id));

    return items.map((item) => ({
      ...item.cartItem,
      product: item.product,
    }));
  }),

  add: authedQuery
    .input(
      z.object({
        productId: z.number(),
        size: z.string().optional(),
        color: z.string().optional(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, ctx.user.id),
            eq(cartItems.productId, input.productId),
            eq(cartItems.size ?? "", input.size ?? "")
          )
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + input.quantity })
          .where(eq(cartItems.id, existing[0].id));
        return existing[0];
      }

      const result = await db.insert(cartItems).values({
        userId: ctx.user.id,
        productId: input.productId,
        size: input.size ?? null,
        color: input.color ?? null,
        quantity: input.quantity,
      });

      const inserted = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, Number(result.lastInsertRowid)))
        .limit(1);

      return inserted[0];
    }),

  updateQuantity: authedQuery
    .input(z.object({ id: z.number(), quantity: z.number().int().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(and(eq(cartItems.id, input.id), eq(cartItems.userId, ctx.user.id)));
      return { success: true };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, input.id), eq(cartItems.userId, ctx.user.id)));
      return { success: true };
    }),

  clear: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));
    return { success: true };
  }),
});
