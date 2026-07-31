import { createClient } from "@libsql/client";

const client = createClient({ url: "file:./db/pacifika.db" });

// Check schema
const cols = await client.execute(`PRAGMA table_info(settings);`);
console.log("Settings columns:", cols.rows.map(r => r.name).join(", "));

// Insert or update settings
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('store_email', 'joelandamale@gmail.com', 'general')
  ON CONFLICT(key) DO UPDATE SET value = 'joelandamale@gmail.com';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('store_phone', '+61 460 786 986', 'general')
  ON CONFLICT(key) DO UPDATE SET value = '+61 460 786 986';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('store_name', 'AndamaleOne Pacifika Wear', 'general')
  ON CONFLICT(key) DO UPDATE SET value = 'AndamaleOne Pacifika Wear';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('store_address', 'Cairns, QLD, Australia', 'general')
  ON CONFLICT(key) DO UPDATE SET value = 'Cairns, QLD, Australia';
`);

// Bank details
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('bank_account_name', 'Joel Andamale T/A AndamaleOne Retail', 'payment')
  ON CONFLICT(key) DO UPDATE SET value = 'Joel Andamale T/A AndamaleOne Retail';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('bank_name', 'Commonwealth Bank', 'payment')
  ON CONFLICT(key) DO UPDATE SET value = 'Commonwealth Bank';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('bank_bsb', '064836', 'payment')
  ON CONFLICT(key) DO UPDATE SET value = '064836';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('bank_account_number', '10465795', 'payment')
  ON CONFLICT(key) DO UPDATE SET value = '10465795';
`);
await client.execute(`
  INSERT INTO settings (key, value, "group") VALUES ('payment_instructions', 'Please transfer the total amount to our bank account. Use your order number as the payment reference. Once payment is confirmed, we will process and ship your order.', 'payment')
  ON CONFLICT(key) DO UPDATE SET value = 'Please transfer the total amount to our bank account. Use your order number as the payment reference. Once payment is confirmed, we will process and ship your order.';
`);

const result = await client.execute(`SELECT key, value FROM settings ORDER BY key;`);
console.log("\nAll settings:");
for (const row of result.rows) {
  console.log(`  ${row.key}: ${row.value}`);
}
process.exit(0);
