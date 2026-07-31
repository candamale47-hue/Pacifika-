import { createClient } from "@libsql/client";

const client = createClient({ url: "file:./db/pacifika.db" });

await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('ga_measurement_id', 'G-XXXXXXXXXX', 'analytics')
  ON CONFLICT(key) DO UPDATE SET value = 'G-XXXXXXXXXX';
`);

const result = await client.execute(`SELECT key, value FROM settings WHERE key = 'ga_measurement_id';`);
console.log("GA setting:", result.rows[0]);
process.exit(0);
