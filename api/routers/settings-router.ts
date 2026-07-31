import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";

export const settingsRouter = createRouter({
  get: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, input.key))
        .limit(1);
      return result[0] ?? null;
    }),

  getGroup: publicQuery
    .input(z.object({ group: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(settings)
        .where(eq(settings.group, input.group));
    }),

  set: adminQuery
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        group: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, input.key))
        .limit(1);

      if (existing[0]) {
        await db
          .update(settings)
          .set({ value: input.value, group: input.group ?? existing[0].group })
          .where(eq(settings.key, input.key));
      } else {
        await db.insert(settings).values({
          key: input.key,
          value: input.value,
          group: input.group ?? "general",
        });
      }

      return { success: true };
    }),
});
