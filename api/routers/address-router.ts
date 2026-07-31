import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { addresses } from "@db/schema";
import { verifyLocalToken } from "./local-auth-router";

export const addressRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-local-auth-token") || ctx.req.headers.get("X-Local-Auth-Token");
    if (!authHeader) return [];

    const payload = await verifyLocalToken(authHeader);
    if (!payload) return [];

    const db = getDb();
    const rows = await db.select().from(addresses).where(eq(addresses.userId, payload.userId));
    return rows;
  }),

  create: publicQuery
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      address1: z.string().min(1),
      address2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postcode: z.string().min(1),
      country: z.string().default("Australia"),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("x-local-auth-token") || ctx.req.headers.get("X-Local-Auth-Token");
      if (!authHeader) throw new Error("Not authenticated");

      const payload = await verifyLocalToken(authHeader);
      if (!payload) throw new Error("Invalid token");

      const db = getDb();

      if (input.isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, payload.userId));
      }

      const result = await db.insert(addresses).values({
        userId: payload.userId,
        ...input,
      });

      const inserted = await db.select().from(addresses).where(eq(addresses.id, Number(result.lastInsertRowid))).limit(1);
      return inserted[0];
    }),

  update: publicQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address1: z.string().min(1).optional(),
      address2: z.string().optional(),
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      postcode: z.string().min(1).optional(),
      country: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("x-local-auth-token") || ctx.req.headers.get("X-Local-Auth-Token");
      if (!authHeader) throw new Error("Not authenticated");

      const payload = await verifyLocalToken(authHeader);
      if (!payload) throw new Error("Invalid token");

      const db = getDb();
      const { id, ...updates } = input;

      const existing = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, payload.userId))).limit(1);
      if (!existing[0]) throw new Error("Address not found");

      if (updates.isDefault) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, payload.userId));
      }

      await db.update(addresses).set(updates).where(eq(addresses.id, id));
      const updated = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
      return updated[0];
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("x-local-auth-token") || ctx.req.headers.get("X-Local-Auth-Token");
      if (!authHeader) throw new Error("Not authenticated");

      const payload = await verifyLocalToken(authHeader);
      if (!payload) throw new Error("Invalid token");

      const db = getDb();
      await db.delete(addresses).where(and(eq(addresses.id, input.id), eq(addresses.userId, payload.userId)));
      return { success: true };
    }),
});
