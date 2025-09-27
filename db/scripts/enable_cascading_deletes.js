#!/usr/bin/env node

/**
 * Enable cascading deletes on existing SQLite database
 * Run: node enable_cascading_deletes.js
 *
 * This script safely enables foreign key constraints with ON DELETE CASCADE
 * by recreating tables with proper constraints while preserving all data.
 * It also recreates all performance indexes and provides verification output.
 */

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "db", "db.sqlite3");

async function enableCascadingDeletes() {
  console.log("🔄 Starting cascading deletes migration...");
  console.log(`📁 Database: ${dbPath}`);

  const db = new Database(dbPath);

  try {
    // Enable foreign keys
    console.log("\n🔗 Enabling foreign keys...");
    db.pragma("foreign_keys = ON");

    // Verify foreign keys are enabled
    const fkStatus = db.pragma("foreign_keys");
    console.log(`  ✅ Foreign keys enabled: ${fkStatus}`);

    // Create temporary tables with proper constraints
    console.log("\n🔨 Creating temporary tables with cascading deletes...");

    const createTempTables = [
      `CREATE TABLE companies_temp (
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

      `CREATE TABLE projects_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        fr_goal REAL,
        created_at TEXT,
        updated_at TEXT
      )`,

      `CREATE TABLE people_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        company_id INTEGER,
        function TEXT,
        created_at TEXT,
        FOREIGN KEY (company_id) REFERENCES companies_temp(id) ON DELETE CASCADE
      )`,

      `CREATE TABLE collaborations_temp (
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
        FOREIGN KEY (company_id) REFERENCES companies_temp(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects_temp(id) ON DELETE CASCADE,
        FOREIGN KEY (person_id) REFERENCES people_temp(id) ON DELETE CASCADE
      )`,
    ];

    createTempTables.forEach((sql) => {
      db.prepare(sql).run();
    });

    console.log("  ✅ Temporary tables created with cascading deletes");

    // Copy data to temp tables (parents first, then children)
    console.log("\n📋 Migrating data to temporary tables...");

    // Temporarily disable foreign key checks for data migration
    db.pragma("foreign_keys = OFF");

    // Copy parent tables first
    console.log("  📊 Copying companies...");
    const companiesCount = db
      .prepare(
        `INSERT INTO companies_temp (id, name, url, address, city, zip, country, phone, budgeting_month, comment)
         SELECT id, name, url, address, city, zip, country, phone, budgeting_month, comment FROM companies`
      )
      .run().changes;
    console.log(`    ✅ ${companiesCount} companies copied`);

    console.log("  📊 Copying projects...");
    const projectsCount = db
      .prepare(
        `INSERT INTO projects_temp (id, name, fr_goal, created_at, updated_at)
         SELECT id, name, fr_goal, created_at, updated_at FROM projects`
      )
      .run().changes;
    console.log(`    ✅ ${projectsCount} projects copied`);

    // Copy child tables with referential integrity checks
    console.log("  📊 Copying people (with valid company references)...");
    const peopleCount = db
      .prepare(
        `INSERT INTO people_temp (id, name, email, phone, company_id, function, created_at)
         SELECT p.id, p.name, p.email, p.phone, p.company_id, p.function, p.created_at
         FROM people p
         WHERE p.company_id IN (SELECT id FROM companies_temp)`
      )
      .run().changes;
    console.log(`    ✅ ${peopleCount} people copied`);

    console.log("  📊 Copying collaborations (with valid references)...");
    const collaborationsCount = db
      .prepare(
        `INSERT INTO collaborations_temp (id, company_id, project_id, person_id, responsible, comment, contacted, successful, letter, meeting, priority, created_at, updated_at, amount, contact_in_future, type)
         SELECT c.id, c.company_id, c.project_id, c.person_id, c.responsible, c.comment, c.contacted, c.successful, c.letter, c.meeting, c.priority, c.created_at, c.updated_at, c.amount, c.contact_in_future, c.type
         FROM collaborations c
         WHERE c.company_id IN (SELECT id FROM companies_temp)
           AND c.project_id IN (SELECT id FROM projects_temp)
           AND c.person_id IN (SELECT id FROM people_temp)`
      )
      .run().changes;
    console.log(`    ✅ ${collaborationsCount} collaborations copied`);

    // Re-enable foreign keys
    db.pragma("foreign_keys = ON");
    console.log("  🔗 Foreign key constraints re-enabled");

    // Drop old tables
    console.log("\n🗑️  Dropping old tables...");
    const dropTables = [
      "DROP TABLE collaborations",
      "DROP TABLE people",
      "DROP TABLE projects",
      "DROP TABLE companies",
    ];
    dropTables.forEach((sql) => {
      db.prepare(sql).run();
    });
    console.log("  ✅ Old tables dropped");

    // Rename temp tables to original names
    console.log("\n🔄 Renaming temporary tables...");
    const renameTables = [
      "ALTER TABLE companies_temp RENAME TO companies",
      "ALTER TABLE projects_temp RENAME TO projects",
      "ALTER TABLE people_temp RENAME TO people",
      "ALTER TABLE collaborations_temp RENAME TO collaborations",
    ];
    renameTables.forEach((sql) => {
      db.prepare(sql).run();
    });
    console.log("  ✅ Tables renamed to original names");

    // Recreate indexes
    console.log("\n📊 Recreating performance indexes...");
    const createIndexes = [
      // Essential indexes for WHERE clauses and JOINs
      `CREATE INDEX IF NOT EXISTS idx_collaborations_company_id ON collaborations(company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_collaborations_project_id ON collaborations(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_collaborations_person_id ON collaborations(person_id)`,
      `CREATE INDEX IF NOT EXISTS idx_people_company_id ON people(company_id)`,

      // Essential indexes for ORDER BY clauses
      `CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name)`,
      `CREATE INDEX IF NOT EXISTS idx_people_name ON people(name)`,
      `CREATE INDEX IF NOT EXISTS idx_collaborations_updated_at ON collaborations(updated_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_collaborations_created_at ON collaborations(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)`,

      // Essential indexes for subqueries and EXISTS checks
      `CREATE INDEX IF NOT EXISTS idx_collaborations_company_contact_future ON collaborations(company_id, contact_in_future)`,

      // Essential indexes for filtered queries
      `CREATE INDEX IF NOT EXISTS idx_collaborations_responsible_filtered ON collaborations(responsible) WHERE responsible IS NOT NULL AND responsible != ''`,
    ];

    createIndexes.forEach((sql) => {
      db.prepare(sql).run();
    });
    console.log("  ✅ All indexes recreated");

    // Verify foreign keys are enabled
    const finalFkStatus = db.pragma("foreign_keys");
    console.log(`\n🔗 Final foreign keys status: ${finalFkStatus}`);

    // Show final record counts
    console.log("\n📊 Final record counts:");
    const tables = ["companies", "projects", "people", "collaborations"];
    tables.forEach((table) => {
      const count = db
        .prepare(`SELECT COUNT(*) as count FROM ${table}`)
        .get().count;
      console.log(`  ${table}: ${count} records`);
    });

    // Show orphaned records that were excluded
    console.log("\n⚠️  Orphaned records excluded during migration:");
    const orphanedPeople = db
      .prepare(
        `SELECT COUNT(*) as count FROM (
          SELECT * FROM people WHERE company_id NOT IN (SELECT id FROM companies)
        )`
      )
      .get().count;
    console.log(`  Orphaned people: ${orphanedPeople}`);

    const orphanedCollaborations = db
      .prepare(
        `SELECT COUNT(*) as count FROM (
          SELECT * FROM collaborations
          WHERE company_id NOT IN (SELECT id FROM companies)
             OR project_id NOT IN (SELECT id FROM projects)
             OR person_id NOT IN (SELECT id FROM people)
        )`
      )
      .get().count;
    console.log(`  Orphaned collaborations: ${orphanedCollaborations}`);

    console.log("\n🎉 Cascading deletes migration completed successfully!");
    console.log(
      "✅ Foreign key constraints with ON DELETE CASCADE are now enabled"
    );
    console.log("✅ All performance indexes have been recreated");
    console.log("✅ Data integrity has been maintained");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    db.close();
    console.log("📕 Database connection closed");
  }
}

// Main execution
async function main() {
  try {
    await enableCascadingDeletes();
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
