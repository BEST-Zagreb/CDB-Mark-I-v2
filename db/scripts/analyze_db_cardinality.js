#!/usr/bin/env node
/**
 * Analyze SQLite database tables and report columns with 2-50 distinct values.
 *
 * Usage:
 *   node analyze_db_cardinality.js [--db <path>] [--min <num>] [--max <num>] [--table <name>]
 *
 * Outputs a simple text report to stdout; exit code 0 on success.
 */

const Database = require("better-sqlite3");
const path = require("path");

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    db: "db/db.sqlite3",
    min: 2,
    max: 50,
    table: null,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--db":
      case "-d":
        options.db = args[++i];
        break;
      case "--min":
        options.min = parseInt(args[++i], 10);
        break;
      case "--max":
        options.max = parseInt(args[++i], 10);
        break;
      case "--table":
      case "-t":
        options.table = args[++i];
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: node analyze_db_cardinality.js [options]

Options:
  -d, --db <path>        Path to SQLite database file (default: db/db.sqlite3)
  --min <number>         Minimum distinct count (default: 2)
  --max <number>         Maximum distinct count (default: 50)
  -t, --table <name>     Specific table to analyze
  -v, --verbose          Verbose output
  -h, --help            Show this help

Examples:
  node analyze_db_cardinality.js
  node analyze_db_cardinality.js --table companies
  node analyze_db_cardinality.js --min 3 --max 20
        `);
        process.exit(0);
    }
  }

  return options;
}

function analyzeTable(db, tableName, minUnique = 2, maxUnique = 50) {
  try {
    // Get column information
    const columnsStmt = db.prepare(`
      PRAGMA table_info(${tableName})
    `);
    const columns = columnsStmt.all();

    if (columns.length === 0) {
      return { error: "no_columns" };
    }

    const results = {};

    for (const column of columns) {
      const colName = column.name;

      // Skip certain system columns or very large text columns
      if (colName === "id" || colName.includes("_id")) {
        continue;
      }

      try {
        // Get distinct values for this column
        const distinctStmt = db.prepare(`
          SELECT DISTINCT ${colName} as value
          FROM ${tableName}
          WHERE ${colName} IS NOT NULL
            AND TRIM(${colName}) != ''
          ORDER BY ${colName}
        `);

        const rows = distinctStmt.all();
        const distinctValues = new Set();

        for (const row of rows) {
          if (row.value !== null && row.value !== undefined) {
            const val = String(row.value).trim();
            if (val !== "") {
              distinctValues.add(val);
            }
          }
        }

        const count = distinctValues.size;

        // Only include columns within our range
        if (count >= minUnique && count <= maxUnique) {
          results[colName] = {
            count,
            values: Array.from(distinctValues),
          };
        }
      } catch (error) {
        if (options.verbose) {
          console.warn(
            `Warning: Could not analyze column ${colName} in table ${tableName}: ${error.message}`
          );
        }
      }
    }

    return { columns: results };
  } catch (error) {
    return { error: error.message };
  }
}

function getTables(db) {
  try {
    const stmt = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return stmt.all().map((row) => row.name);
  } catch (error) {
    console.error(`Error getting tables: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  const options = parseArgs();
  const dbPath = path.resolve(process.cwd(), options.db);

  try {
    const db = new Database(dbPath, { readonly: true });

    let tablesToAnalyze = [];

    if (options.table) {
      // Check if the specified table exists
      const existsStmt = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
      );
      const exists = existsStmt.get(options.table);
      if (!exists) {
        console.error(`Table '${options.table}' not found in database`);
        process.exit(1);
      }
      tablesToAnalyze = [options.table];
    } else {
      tablesToAnalyze = getTables(db);
    }

    console.log(`Database: ${dbPath}`);
    console.log(
      `Analyzing columns with ${options.min}-${options.max} distinct values\n`
    );

    for (const tableName of tablesToAnalyze) {
      console.log(`Table: ${tableName}`);

      const result = analyzeTable(db, tableName, options.min, options.max);

      if (result.error) {
        console.log(`  Skipped: ${result.error}`);
        continue;
      }

      const columns = result.columns;
      const columnNames = Object.keys(columns);

      if (columnNames.length === 0) {
        console.log("  No columns with distinct counts in the requested range");
      } else {
        for (const colName of columnNames) {
          const data = columns[colName];
          const sample = data.values.join(", ");
          console.log(
            `  Column: ${colName} -> ${data.count} distinct values: ${sample}`
          );
        }
      }

      console.log();
    }

    db.close();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
