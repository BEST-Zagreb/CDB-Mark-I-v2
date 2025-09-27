import { createClient, Client } from "@libsql/client";

// Database client instance
let db: Client | null = null;

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
