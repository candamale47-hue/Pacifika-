const { Database } = require('better-sqlite3');
const db = new Database('./db/pacifika.db');

const products = [
  ["Art Mens Shirt", "art-mens-shirt", "Authentic Pacific Island fashion. Features traditional Pacific Island artwork.", 4500, "shirts", 24],
  ["Tribal Mask Mens Shirt", "tribal-mask-mens-shirt", "Authentic Pacific Island fashion. Features bold Tribal Mask design.", 4500, "shirts", 24],
  ["Summer Break Mens Shirt", "summer-break-mens-shirt", "Authentic Pacific Island fashion. Features Summer Break print.", 4500, "shirts", 18],
  ["Mens Shirt Tribal", "mens-shirt-tribal", "Authentic Pacific Island fashion. Features bold Tribal pattern design.", 3500, "shirts", 18],
  ["Mens Shirt Tapa", "mens-shirt-tapa", "Authentic Pacific Island fashion. Features traditional Tapa cloth patterns.", 3500, "shirts", 12],
  ["Summer Break Ladies Dress", "summer-break-ladies-dress", "Authentic Pacific Island fashion. Features Summer Break print.", 4500, "dresses", 14],
  ["Tribal Mask Ladies Top", "tribal-mask-ladies-top", "Authentic Pacific Island fashion. Features bold Tribal Mask design.", 4000, "dresses", 14],
  ["Art Ladies Dress", "art-ladies-dress", "Authentic Pacific Island fashion. Features traditional artwork.", 4500, "dresses", 14],
  ["Art Boys Shirt", "art-boys-shirt", "Authentic Pacific Island fashion. Features traditional artwork.", 3000, "kids", 12],
  ["Art Girls Dress", "art-girls-dress", "Authentic Pacific Island fashion. Features traditional artwork.", 3000, "kids", 12],
];

const insert = db.prepare(`INSERT OR IGNORE INTO products (name, slug, description, price, category, stock, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`);

let count = 0;
for (const p of products) {
  try { insert.run(p); count++; console.log("Added: " + p[0]); } catch (e) { console.log("Skipped: " + p[0]); }
}
console.log("Done! " + count + " products added.");
db.close();
