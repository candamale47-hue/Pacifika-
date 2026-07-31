import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { promoCodes } from "@db/schema";

export const promoRouter = createRouter({
  validate: publicQuery
    .input(z.object({ code: z.string(), orderTotal: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const code = input.code.toUpperCase();
      const promo = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, code))
        .limit(1);

      if (!promo[0]) {
        return { valid: false, message: "Invalid promo code" };
      }

      const p = promo[0];

      if (!p.isActive) {
        return { valid: false, message: "Promo code is inactive" };
      }

      if (p.usageLimit && (p.usageCount ?? 0) >= p.usageLimit) {
        return { valid: false, message: "Promo code usage limit reached" };
      }

      if (p.validFrom && new Date(p.validFrom) > new Date()) {
        return { valid: false, message: "Promo code not yet valid" };
      }

      if (p.validUntil && new Date(p.validUntil) < new Date()) {
        return { valid: false, message: "Promo code expired" };
      }

      const minAmount = Number(p.minOrderAmount);
      if (minAmount > 0 && input.orderTotal < minAmount) {
        return { valid: false, message: `Minimum order amount $${minAmount} required` };
      }

      let discount = 0;
      if (p.type === "percentage") {
        discount = input.orderTotal * (Number(p.value) / 100);
      } else {
        discount = Number(p.value);
      }

      if (p.maxDiscount && discount > Number(p.maxDiscount)) {
        discount = Number(p.maxDiscount);
      }

      return {
        valid: true,
        discount: Math.round(discount * 100) / 100,
        promoCodeId: p.id,
        message: `Saved $${discount.toFixed(2)}`,
      };
    }),

  list: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(promoCodes).orderBy(promoCodes.createdAt);
  }),

  create: adminQuery
    .input(
      z.object({
        code: z.string().min(1),
        type: z.enum(["percentage", "fixed"]),
        value: z.number().positive(),
        minOrderAmount: z.number().optional(),
        maxDiscount: z.number().optional(),
        usageLimit: z.number().int().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(promoCodes).values({
        code: input.code.toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount ?? 0,
        maxDiscount: input.maxDiscount ?? null,
        usageLimit: input.usageLimit ?? null,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      });

      const inserted = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.id, Number(result.lastInsertRowid)))
        .limit(1);

      return inserted[0];
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        type: z.enum(["percentage", "fixed"]).optional(),
        value: z.number().optional(),
        minOrderAmount: z.number().optional(),
        maxDiscount: z.number().optional(),
        usageLimit: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(promoCodes).set(data).where(eq(promoCodes.id, id));
      const updated = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
      return updated[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(promoCodes).where(eq(promoCodes.id, input.id));
      return { success: true };
    }),
});
