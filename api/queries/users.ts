import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: {
  unionId: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  role?: "user" | "admin";
  lastSignInAt?: Date;
}) {
  const values = { ...data };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
  }

  const existing = await findUserByUnionId(data.unionId);

  if (existing) {
    await getDb()
      .update(schema.users)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id));
  } else {
    await getDb().insert(schema.users).values(values);
  }
}
