import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "db", "pacifika.db");
const db = new Database(dbPath);

// Create collections table
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
const tableNames = tables.map((t) => t.name);

if (!tableNames.includes("collections")) {
  db.prepare(`
    CREATE TABLE collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      sortOrder INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `).run();
  console.log("Created collections table");
}

if (!tableNames.includes("collection_products")) {
  db.prepare(`
    CREATE TABLE collection_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collectionId INTEGER NOT NULL REFERENCES collections(id),
      productId INTEGER NOT NULL REFERENCES products(id),
      sortOrder INTEGER DEFAULT 0
    )
  `).run();
  console.log("Created collection_products table");
}

db.close();
console.log("Migration complete");
