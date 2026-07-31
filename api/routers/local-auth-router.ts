import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, orders, passwordResetTokens } from "@db/schema";
import { sendPasswordResetEmail } from "../lib/email";

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "pacifika-local-auth-secret"
);

async function createToken(userId: number): Promise<string> {
  return new SignJWT({ userId, type: "local" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyLocalToken(
  token: string
): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 60,
    });
    if (payload.userId && typeof payload.userId === "number") {
      return { userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6).max(100),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing[0]) {
        throw new Error("Email already registered");
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const result = await db.insert(users).values({
        unionId: input.email,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "user",
      });

      const userId = Number(result.lastInsertRowid);
      const token = await createToken(userId);

      return { token, userId };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      const user = userRows[0];
      if (!user || !user.password) {
        throw new Error("Invalid email or password");
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new Error("Invalid email or password");
      }

      const token = await createToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader =
      ctx.req.headers.get("x-local-auth-token") ||
      ctx.req.headers.get("X-Local-Auth-Token");

    if (!authHeader) return null;

    const payload = await verifyLocalToken(authHeader);
    if (!payload) return null;

    const db = getDb();
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const user = userRows[0];
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };
  }),

  myOrders: publicQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("x-local-auth-token") || ctx.req.headers.get("X-Local-Auth-Token");
      if (!authHeader) return { orders: [], total: 0 };

      const payload = await verifyLocalToken(authHeader);
      if (!payload) return { orders: [], total: 0 };

      const db = getDb();
      const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (!user[0] || !user[0].email) return { orders: [], total: 0 };

      const items = await db
        .select()
        .from(orders)
        .where(eq(orders.shippingEmail, user[0].email))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.shippingEmail, user[0].email));

      return { orders: items, total: countResult[0]?.count ?? 0 };
    }),

  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user[0]) return { success: true, message: "If an account exists, a reset code has been sent." };

      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Mark any existing tokens for this email as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.email, input.email));

      await db.insert(passwordResetTokens).values({
        email: input.email,
        token: code,
        expiresAt,
      });

      try {
        await sendPasswordResetEmail(input.email, code, user[0].name);
      } catch (emailErr) {
        console.error("[Forgot Password] Email failed:", emailErr);
      }

      return { success: true, message: "If an account exists, a reset code has been sent to your email." };
    }),

  resetPassword: publicQuery
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const token = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.email, input.email))
        .orderBy(sql`${passwordResetTokens.createdAt} DESC`)
        .limit(1);

      if (!token[0] || token[0].used || token[0].token !== input.code) {
        throw new Error("Invalid or expired reset code");
      }

      if (new Date() > new Date(token[0].expiresAt)) {
        throw new Error("Reset code has expired");
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.email, input.email));
      await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, token[0].id));

      return { success: true, message: "Password updated successfully" };
    }),
});
