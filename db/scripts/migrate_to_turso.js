#!/usr/bin/env node

/**
 * Migrate data from local SQLite database to Turso database
 * Run: node migrate_to_turso.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const { createClient } = require("@libsql/client");

// Database paths
const localDbPath = path.join(process.cwd(), "db", "db.sqlite3");

// Turso configuration
const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error(
    "❌ TURSO_DB_URL and TURSO_DB_TOKEN environment variables are required"
  );
  process.exit(1);
}

async function migrateTable(localDb, tursoDb, tableName, columns) {
  console.log(`\n🔄 Migrating table: ${tableName}`);

  try {
    // Get all data from local database
    const selectStmt = localDb.prepare(`SELECT * FROM ${tableName}`);
    const rows = selectStmt.all();

    if (rows.length === 0) {
      console.log(`  ℹ️  No data to migrate for ${tableName}`);
      return 0;
    }

    console.log(`  📊 Found ${rows.length} rows to migrate`);

    // Insert data into Turso in batches
    const batchSize = 100; // Adjust batch size as needed
    let migratedCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      // Build INSERT statement
      const placeholders = batch
        .map(() => `(${columns.map(() => "?").join(", ")})`)
        .join(", ");
      const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(
        ", "
      )}) VALUES ${placeholders}`;

      // Flatten the values
      const values = batch.flatMap((row) => columns.map((col) => row[col]));

      await tursoDb.execute({
        sql,
        args: values,
      });

      migratedCount += batch.length;
      console.log(`  ✅ Migrated ${migratedCount}/${rows.length} rows`);
    }

    console.log(`  ✅ Completed migration of ${tableName}`);
    return migratedCount;
  } catch (error) {
    console.error(`  ❌ Error migrating ${tableName}:`, error);
    throw error;
  }
}

async function createTablesIfNotExist(tursoDb) {
  console.log("🔨 Creating tables in Turso if they don't exist...");

  const createTableStatements = [
    `CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      url TEXT,
      address TEXT,
      city TEXT,
      zip TEXT,
      country TEXT,
      phone TEXT,
      budgeting_month TEXT,
      comment TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      fr_goal REAL,
      created_at TEXT,
      updated_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      company_id INTEGER,
      function TEXT,
      created_at TEXT,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )`,

    `CREATE TABLE IF NOT EXISTS collaborations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      project_id INTEGER,
      person_id INTEGER,
      responsible TEXT,
      comment TEXT,
      contacted INTEGER,
      successful INTEGER,
      letter INTEGER,
      meeting INTEGER,
      priority TEXT,
      created_at TEXT,
      updated_at TEXT,
      amount REAL,
      contact_in_future INTEGER,
      type TEXT,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (person_id) REFERENCES people(id)
    )`,
  ];

  for (const sql of createTableStatements) {
    await tursoDb.execute(sql);
  }

  console.log("✅ Tables created or already exist");
}

async function main() {
  console.log("🚀 Starting migration from local SQLite to Turso");
  console.log(`📁 Local database: ${localDbPath}`);
  console.log(`🌐 Turso database: ${tursoUrl}`);

  let localDb;
  let tursoDb;

  try {
    // Open local database
    console.log("\n📖 Opening local database...");
    localDb = new Database(localDbPath, { readonly: true });

    // Connect to Turso
    console.log("🔗 Connecting to Turso...");
    tursoDb = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });

    // Test connections
    console.log("🧪 Testing connections...");
    const localTest = localDb
      .prepare("SELECT COUNT(*) as count FROM companies")
      .get();
    console.log(`  ✅ Local DB: ${localTest.count} companies`);

    const tursoTest = await tursoDb.execute("SELECT 1 as test");
    console.log("  ✅ Turso DB: Connected");

    // Create tables in Turso
    await createTablesIfNotExist(tursoDb);

    // Define table schemas
    const tables = {
      companies: [
        "id",
        "name",
        "url",
        "address",
        "city",
        "zip",
        "country",
        "phone",
        "budgeting_month",
        "comment",
      ],
      projects: ["id", "name", "fr_goal", "created_at", "updated_at"],
      people: [
        "id",
        "name",
        "email",
        "phone",
        "company_id",
        "function",
        "created_at",
      ],
      collaborations: [
        "id",
        "company_id",
        "project_id",
        "person_id",
        "responsible",
        "comment",
        "contacted",
        "successful",
        "letter",
        "meeting",
        "priority",
        "created_at",
        "updated_at",
        "amount",
        "contact_in_future",
        "type",
      ],
    };

    // Migrate each table
    let totalMigrated = 0;
    for (const [tableName, columns] of Object.entries(tables)) {
      const migrated = await migrateTable(localDb, tursoDb, tableName, columns);
      totalMigrated += migrated;
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Total records migrated: ${totalMigrated}`);

    // Verify migration
    console.log("\n🔍 Verifying migration...");
    for (const tableName of Object.keys(tables)) {
      const localCount = localDb
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .get().count;
      const tursoResult = await tursoDb.execute(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      const tursoCount = tursoResult.rows[0].count;

      console.log(
        `  ${tableName}: Local=${localCount}, Turso=${tursoCount} ${
          localCount === tursoCount ? "✅" : "❌"
        }`
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    // Close connections
    if (localDb) {
      localDb.close();
      console.log("📕 Local database closed");
    }
    if (tursoDb) {
      await tursoDb.close();
      console.log("🔌 Turso connection closed");
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}
