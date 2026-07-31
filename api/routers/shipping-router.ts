import { z } from "zod";
import { eq, and, isNull, or, sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { shippingRates } from "@db/schema";

const CAIRNS_POSTCODES = ["4870", "4871", "4872", "4873", "4874", "4875", "4876", "4877", "4878", "4879"];

export const shippingRouter = createRouter({
  calculate: publicQuery
    .input(
      z.object({
        postcode: z.string(),
        country: z.string(),
        weightGrams: z.number().default(500),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { postcode, country, weightGrams } = input;

      if (country.toUpperCase() === "AU" && CAIRNS_POSTCODES.includes(postcode)) {
        return { cost: 0, name: "Cairns Local Delivery (Free)", free: true };
      }

      const countryCode = country.toUpperCase() === "AU" ? "AU" : null;

      const rates = await db
        .select()
        .from(shippingRates)
        .where(
          and(
            eq(shippingRates.isActive, true),
            or(
              countryCode ? eq(shippingRates.countryCode, countryCode) : isNull(shippingRates.countryCode),
              isNull(shippingRates.countryCode)
            ),
            or(
              isNull(shippingRates.minWeight),
              sql`${shippingRates.minWeight} <= ${weightGrams}`
            ),
            or(
              isNull(shippingRates.maxWeight),
              sql`${shippingRates.maxWeight} >= ${weightGrams}`
            )
          )
        );

      if (rates.length === 0) {
        return { cost: 15, name: "Standard Shipping", free: false };
      }

      const bestRate = rates.reduce((best, rate) => {
        if (Number(rate.rate) < Number(best.rate)) return rate;
        return best;
      });

      return {
        cost: Number(bestRate.rate),
        name: bestRate.name,
        free: false,
      };
    }),

  listRates: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(shippingRates).orderBy(shippingRates.id);
  }),

  upsertRate: adminQuery
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        countryCode: z.string().optional(),
        region: z.string().optional(),
        minWeight: z.number().optional(),
        maxWeight: z.number().optional(),
        rate: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      if (id) {
        await db.update(shippingRates).set(data).where(eq(shippingRates.id, id));
        const updated = await db.select().from(shippingRates).where(eq(shippingRates.id, id)).limit(1);
        return updated[0];
      } else {
        const result = await db.insert(shippingRates).values(data);
        const inserted = await db
          .select()
          .from(shippingRates)
          .where(eq(shippingRates.id, Number(result.lastInsertRowid)))
          .limit(1);
        return inserted[0];
      }
    }),

  deleteRate: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(shippingRates).where(eq(shippingRates.id, input.id));
      return { success: true };
    }),
});
