import Database from "better-sqlite3";
import path from "path";

// Database instance
let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), "db", "cdb.sqlite3");
    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Graceful shutdown
process.on("SIGINT", closeDatabase);
process.on("SIGTERM", closeDatabase);
process.on("exit", closeDatabase);
