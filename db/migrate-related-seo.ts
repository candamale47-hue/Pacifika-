/**
 * Migration: Add metaTitle, metaDescription, relatedProductIds columns to products
 */
import Database from "better-sqlite3";
import { join } from "path";

const dbPath = process.env.DATABASE_URL?.replace("sqlite:", "") || join(process.cwd(), "db", "pacifika.db");
const db = new Database(dbPath);

// Check if columns exist
const columns = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
const columnNames = columns.map((c) => c.name);

if (!columnNames.includes("metaTitle")) {
  db.prepare("ALTER TABLE products ADD COLUMN metaTitle TEXT").run();
  console.log("Added metaTitle column");
}
if (!columnNames.includes("metaDescription")) {
  db.prepare("ALTER TABLE products ADD COLUMN metaDescription TEXT").run();
  console.log("Added metaDescription column");
}
if (!columnNames.includes("relatedProductIds")) {
  db.prepare("ALTER TABLE products ADD COLUMN relatedProductIds TEXT").run();
  console.log("Added relatedProductIds column");
}

db.close();
console.log("Migration complete");
