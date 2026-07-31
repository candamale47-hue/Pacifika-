import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "db", "pacifika.db");
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
const tableNames = tables.map((t) => t.name);

if (!tableNames.includes("lookbook_items")) {
  db.prepare(`
    CREATE TABLE lookbook_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT NOT NULL,
      productIds TEXT,
      sortOrder INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `).run();
  console.log("Created lookbook_items table");
}

if (!tableNames.includes("lookbook_seed")) {
  // Insert sample lookbook items with product image URLs
  const sampleData = [
    { title: "Island Sunset Collection", description: "Golden hour elegance for your next island getaway", image: "/images/hero-banner.jpg", productIds: "[]", sortOrder: 0 },
    { title: "Traditional Puletasi", description: "Handcrafted cultural designs for special occasions", image: "/images/category-puletasi.jpg", productIds: "[]", sortOrder: 1 },
    { title: "Island Shirts", description: "Vibrant tropical prints for every day", image: "/images/category-shirts.jpg", productIds: "[]", sortOrder: 2 },
    { title: "Kids Island Wear", description: "Adorable Pacific Island fashion for the little ones", image: "/images/category-kids.jpg", productIds: "[]", sortOrder: 3 },
  ];
  for (const item of sampleData) {
    db.prepare("INSERT INTO lookbook_items (title, description, image, productIds, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)").run(
      item.title, item.description, item.image, item.productIds, item.sortOrder
    );
  }
  console.log("Seeded lookbook_items with sample data");
}

// Add videoUrls to products if not exists
const columns = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
const columnNames = columns.map((c) => c.name);

if (!columnNames.includes("videoUrls")) {
  db.prepare("ALTER TABLE products ADD COLUMN videoUrls TEXT").run();
  console.log("Added videoUrls column to products");
}

db.close();
console.log("Migration complete");
