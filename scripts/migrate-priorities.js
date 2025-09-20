#!/usr/bin/env node

/**
 * Migration script to convert numeric priority values to string format
 * Run this script to update existing collaboration data in the database
 *
 * This converts:
 * 1-2 -> "low"
 * 3   -> "medium"
 * 4-5 -> "high"
 */

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "db", "cdb.sqlite3");

console.log("🔄 Starting priority migration...");

try {
  const db = new Database(dbPath);

  // Check current priority values
  const currentPriorities = db
    .prepare(
      `
    SELECT DISTINCT priority, COUNT(*) as count 
    FROM collaborations 
    GROUP BY priority 
    ORDER BY priority
  `
    )
    .all();

  console.log("\n📊 Current priority values:");
  currentPriorities.forEach((row) => {
    console.log(`  Priority ${row.priority}: ${row.count} records`);
  });

  // Start transaction for safe migration
  const migrate = db.transaction(() => {
    // Convert numeric priorities to strings
    const updates = [
      { from: 1, to: "low" },
      { from: 2, to: "low" },
      { from: 3, to: "medium" },
      { from: 4, to: "high" },
      { from: 5, to: "high" },
      { from: null, to: "medium" }, // Optional: set null priorities to 'medium'
      { from: "t", to: "high" },
      { from: "f", to: "low" },
    ];

    let totalUpdated = 0;

    updates.forEach(({ from, to }) => {
      const result = db
        .prepare(
          `
        UPDATE collaborations 
        SET priority = ? 
        WHERE priority = ?
      `
        )
        .run(to, from);

      if (result.changes > 0) {
        console.log(
          `  ✅ Updated ${result.changes} records from ${from} to "${to}"`
        );
        totalUpdated += result.changes;
      }
    });

    return totalUpdated;
  });

  console.log("\n🚀 Executing migration...");
  const totalUpdated = migrate();

  // Verify the migration
  const newPriorities = db
    .prepare(
      `
    SELECT DISTINCT priority, COUNT(*) as count 
    FROM collaborations 
    GROUP BY priority 
    ORDER BY priority
  `
    )
    .all();

  console.log("\n📊 Updated priority values:");
  newPriorities.forEach((row) => {
    console.log(`  Priority "${row.priority}": ${row.count} records`);
  });

  console.log(`\n✅ Migration completed successfully!`);
  console.log(`📈 Total records updated: ${totalUpdated}`);

  db.close();
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}
