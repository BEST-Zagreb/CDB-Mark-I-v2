import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

// Database client instance
const client = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
});

// Drizzle ORM instance with schema
export const db = drizzle(client, { schema });

// Legacy function for backward compatibility during migration
export async function getDatabase() {
  return client;
}

export async function closeDatabase() {
  await client.close();
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
