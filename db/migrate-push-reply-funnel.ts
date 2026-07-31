import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "db", "pacifika.db");
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
const tableNames = tables.map((t) => t.name);

if (!tableNames.includes("push_subscriptions")) {
  db.prepare(`
    CREATE TABLE push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `).run();
  console.log("Created push_subscriptions table");
}

if (!tableNames.includes("review_replies")) {
  db.prepare(`
    CREATE TABLE review_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewId INTEGER NOT NULL REFERENCES reviews(id),
      reply TEXT NOT NULL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `).run();
  console.log("Created review_replies table");
}

if (!tableNames.includes("funnel_events")) {
  db.prepare(`
    CREATE TABLE funnel_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      productId INTEGER,
      orderId INTEGER,
      value REAL,
      createdAt INTEGER DEFAULT (unixepoch() * 1000)
    )
  `).run();
  console.log("Created funnel_events table");
  db.prepare("CREATE INDEX idx_funnel_type ON funnel_events(type)").run();
  db.prepare("CREATE INDEX idx_funnel_session ON funnel_events(sessionId)").run();
  db.prepare("CREATE INDEX idx_funnel_created ON funnel_events(createdAt)").run();
  console.log("Created funnel_events indexes");
}

db.close();
console.log("Migration complete");
