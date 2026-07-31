import { createClient } from "@libsql/client";
const client = createClient({ url: "file:./db/pacifika.db" });
await client.execute(`INSERT INTO settings (key, value, "group") VALUES ('fb_pixel_id', '', 'analytics') ON CONFLICT(key) DO NOTHING;`);
await client.execute(`INSERT INTO settings (key, value, "group") VALUES ('push_notifications_enabled', 'true', 'notifications') ON CONFLICT(key) DO NOTHING;`);
console.log("Added TOR settings");
process.exit(0);
