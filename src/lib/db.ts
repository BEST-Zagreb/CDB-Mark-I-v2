import { createClient } from "@libsql/client";

// Database client instance
let db: any = null;

export async function getDatabase() {
  if (!db) {
    const url = process.env.TURSO_DB_URL;
    const authToken = process.env.TURSO_DB_TOKEN;

    if (!url || !authToken) {
      throw new Error(
        "TURSO_DB_URL and TURSO_DB_TOKEN environment variables are required"
      );
    }

    db = createClient({
      url,
      authToken,
    });

    // Optimize for read-heavy workloads
    await db.execute("PRAGMA foreign_keys = ON");
    await db.execute("PRAGMA cache_size = -128000"); // 128MB cache for more reads
    await db.execute("PRAGMA mmap_size = 268435456"); // 256MB memory mapping
    await db.execute("PRAGMA synchronous = NORMAL");
    await db.execute("PRAGMA journal_mode = WAL");
    await db.execute("PRAGMA wal_autocheckpoint = 1000"); // Auto-checkpoint WAL
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabase();
  process.exit(0);
});

process.on("exit", async () => {
  await closeDatabase();
});
