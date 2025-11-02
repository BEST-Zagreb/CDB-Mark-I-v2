#!/usr/bin/env node

/**
 * Export the entire Turso database to a local SQLite file.
 *
 * Usage:
 *   TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) \
 *   TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) \
 *   node db/scripts/export_turso_db.js [output-path]
 *
 * The optional [output-path] argument overrides the default output file at db/turso-export.sqlite3.
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { createClient } = require("@libsql/client");

const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error(
    "ERROR: TURSO_DB_URL and TURSO_DB_TOKEN environment variables are required"
  );
  process.exit(1);
}

const outputArg = process.argv[2];
const defaultOutput = path.join(process.cwd(), "db", "turso-export.sqlite3");
const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : defaultOutput;

function quoteIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function fetchTables(client) {
  const tablesResult = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return tablesResult.rows.map((row) => ({
    name: row.name,
    sql: row.sql,
  }));
}

async function fetchSchemaObjects(client) {
  const objectsResult = await client.execute(
    "SELECT name, sql, type FROM sqlite_master WHERE type IN ('index', 'trigger', 'view') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type, name"
  );
  return objectsResult.rows.map((row) => ({
    name: row.name,
    sql: row.sql,
    type: row.type,
  }));
}

async function fetchColumns(client, tableName) {
  const pragma = `PRAGMA table_info(${quoteIdentifier(tableName)})`;
  const result = await client.execute(pragma);
  return result.rows.map((row) => row.name);
}

async function fetchRows(client, tableName) {
  const selectSql = `SELECT * FROM ${quoteIdentifier(tableName)}`;
  const result = await client.execute(selectSql);
  return result.rows;
}

async function exportTursoDatabase() {
  console.log("Starting Turso database export...");
  console.log(`Turso URL: ${tursoUrl}`);
  console.log(`Output file: ${outputPath}`);

  const dirName = path.dirname(outputPath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath);
  }

  const tursoDb = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  const localDb = new Database(outputPath);
  localDb.pragma("journal_mode = WAL");
  localDb.pragma("foreign_keys = OFF");

  try {
    console.log("Fetching schema definitions...");
    const tables = await fetchTables(tursoDb);

    tables.forEach((table) => {
      if (!table.sql) {
        return;
      }
      console.log(`  Creating table ${table.name}`);
      localDb.exec(table.sql);
    });

    for (const table of tables) {
      console.log(`\nExporting data from ${table.name}`);
      const columns = await fetchColumns(tursoDb, table.name);

      if (columns.length === 0) {
        console.log("  No columns found, skipping table");
        continue;
      }

      const rows = await fetchRows(tursoDb, table.name);
      console.log(`  Rows fetched: ${rows.length}`);

      if (rows.length === 0) {
        continue;
      }

      const columnList = columns.map(quoteIdentifier).join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      const insertSql = `INSERT INTO ${quoteIdentifier(
        table.name
      )} (${columnList}) VALUES (${placeholders})`;
      const insertStmt = localDb.prepare(insertSql);

      const insertMany = localDb.transaction((data) => {
        for (const row of data) {
          const values = columns.map((column) => row[column]);
          insertStmt.run(values);
        }
      });

      insertMany(rows);
      console.log(`  Inserted ${rows.length} rows into ${table.name}`);
    }

    console.log("\nRecreating indexes, triggers, and views...");
    const schemaObjects = await fetchSchemaObjects(tursoDb);
    schemaObjects.forEach((object) => {
      console.log(`  Creating ${object.type}: ${object.name}`);
      localDb.exec(object.sql);
    });

    localDb.pragma("foreign_keys = ON");
    console.log("\nExport complete.");
  } catch (error) {
    console.error("Export failed:", error);
    process.exitCode = 1;
  } finally {
    await tursoDb.close();
    localDb.close();
  }
}

exportTursoDatabase().catch((error) => {
  console.error("Unexpected error during export:", error);
  process.exit(1);
});
