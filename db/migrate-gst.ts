import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "db", "pacifika.db");
const db = new Database(dbPath);

const columns = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[];
const columnNames = columns.map((c) => c.name);

if (!columnNames.includes("gstAmount")) {
  db.prepare("ALTER TABLE orders ADD COLUMN gstAmount REAL DEFAULT 0").run();
  console.log("Added gstAmount column");
}

if (!columnNames.includes("totalInclGst")) {
  db.prepare("ALTER TABLE orders ADD COLUMN totalInclGst REAL").run();
  console.log("Added totalInclGst column");
  // Backfill existing orders: set totalInclGst = total
  db.prepare("UPDATE orders SET totalInclGst = total WHERE totalInclGst IS NULL").run();
  console.log("Backfilled totalInclGst for existing orders");
}

db.close();
console.log("GST migration complete");
