import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";

const client = createClient({ url: "file:./db/pacifika.db" });

const hashedPassword = await bcrypt.hash("JMA@2008", 12);
const now = new Date().toISOString();

await client.execute(`
  INSERT INTO users (unionId, name, password, role, createdAt, updatedAt)
  VALUES ('Andamamle1', 'Joel Andamale', '${hashedPassword}', 'admin', '${now}', '${now}')
  ON CONFLICT DO UPDATE SET
    password = '${hashedPassword}',
    role = 'admin',
    name = 'Joel Andamale',
    updatedAt = '${now}';
`);

const result = await client.execute(`SELECT id, unionId, name, role FROM users WHERE unionId = 'Andamamle1';`);
console.log("Admin user:", result.rows[0]);
process.exit(0);
