import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { reviews, reviewReplies, orders, orderItems, products } from "@db/schema";

export const reviewRouter = createRouter({
  adminList: adminQuery
    .query(async () => {
      const db = getDb();
      const items = await db
        .select()
        .from(reviews)
        .orderBy(desc(reviews.createdAt));

      // Enrich with product names
      const enriched = await Promise.all(
        items.map(async (review) => {
          const product = await db
            .select({ name: products.name })
            .from(products)
            .where(eq(products.id, review.productId))
            .limit(1);
          return { ...review, productName: product[0]?.name ?? "Unknown" };
        })
      );

      return enriched;
    }),

  list: publicQuery
    .input(z.object({ productId: z.number(), page: z.number().default(1), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = getDb();
      const items = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.productId, input.productId), eq(reviews.isApproved, true)))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      // Get replies for these reviews
      const replies = await db
        .select()
        .from(reviewReplies)
        .where(
          sql`${reviewReplies.reviewId} IN (${items.map((r) => r.id).join(",")})`
        );

      const replyMap = new Map(replies.map((r) => [r.reviewId, r]));

      const itemsWithReplies = items.map((item) => ({
        ...item,
        ownerReply: replyMap.get(item.id) ?? null,
      }));

      const countResult = await db
        .select({ count: sql<number>`count(*)`, avg: sql<number>`avg(rating)` })
        .from(reviews)
        .where(and(eq(reviews.productId, input.productId), eq(reviews.isApproved, true)));

      return {
        reviews: itemsWithReplies,
        total: countResult[0]?.count ?? 0,
        averageRating: Math.round((countResult[0]?.avg ?? 0) * 10) / 10,
      };
    }),

  // Check if a user has purchased a product (for verified badge)
  checkVerified: publicQuery
    .input(z.object({ productId: z.number(), email: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      // Find orders by this email that contain this product
      const orderIds = await db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orderItems.productId, input.productId),
            eq(orders.shippingEmail, input.email)
          )
        )
        .limit(1);

      return { verified: orderIds.length > 0 };
    }),

  // Submit a review (public - anyone can submit)
  create: publicQuery
    .input(
      z.object({
        productId: z.number(),
        userName: z.string().min(1).max(100),
        email: z.string().email(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if this email has purchased the product (verified)
      const orderIds = await db
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orderItems.productId, input.productId),
            eq(orders.shippingEmail, input.email)
          )
        )
        .limit(1);

      const isVerified = orderIds.length > 0;

      // Check for duplicate review from same email on same product
      const existing = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.productId, input.productId),
            eq(reviews.userName, input.userName)
          )
        )
        .limit(1);

      if (existing[0]) {
        throw new Error("You have already reviewed this product");
      }

      const result = await db.insert(reviews).values({
        productId: input.productId,
        userName: input.userName,
        rating: input.rating,
        comment: input.comment,
        isApproved: false,
      });

      // If verified, update the review to note it
      const insertedId = Number(result.lastInsertRowid);
      if (isVerified) {
        await db
          .update(reviews)
          .set({ comment: input.comment + " [Verified Purchase]" })
          .where(eq(reviews.id, insertedId));
      }

      const inserted = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, insertedId))
        .limit(1);

      return inserted[0];
    }),

  moderate: adminQuery
    .input(z.object({ id: z.number(), isApproved: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(reviews)
        .set({ isApproved: input.isApproved })
        .where(eq(reviews.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),

  reply: adminQuery
    .input(z.object({ reviewId: z.number(), reply: z.string().min(1).max(1000) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete any existing reply first
      await db.delete(reviewReplies).where(eq(reviewReplies.reviewId, input.reviewId));
      await db.insert(reviewReplies).values({
        reviewId: input.reviewId,
        reply: input.reply,
      });
      return { success: true };
    }),

  deleteReply: adminQuery
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(reviewReplies).where(eq(reviewReplies.reviewId, input.reviewId));
      return { success: true };
    }),
});
