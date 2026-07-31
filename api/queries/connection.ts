import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

const client = createClient({
  url: process.env.DATABASE_URL || "file:./db/pacifika.db",
});

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}
