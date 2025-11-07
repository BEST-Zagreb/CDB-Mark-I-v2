#!/usr/bin/env node

/**
 * Export the entire Turso database using the /dump endpoint.
 * Creates both a SQL dump file and a proper SQLite database file.
 *
 * Requirements:
 *   - sqlite3 command-line tool (for creating .sqlite3 database file)
 *   - Install: https://www.sqlite.org/download.html
 *
 * Usage:
 *   TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) node db/scripts/export_turso_db.js [optional-output-path]
 *
 * Output:
 *   - cdb_dump-tursodb-YYYY_MM_DD-HH_MM_SS.sql (SQL script)
 *   - cdb_dump-tursodb-YYYY_MM_DD-HH_MM_SS.sqlite3 (SQLite database)
 *
 * Example:
 *   node db/scripts/export_turso_db.js
 *   node db/scripts/export_turso_db.js ./backups/mybackup.sqlite3
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error(
    "ERROR: TURSO_DB_URL and TURSO_DB_TOKEN environment variables are required"
  );
  process.exit(1);
}

/**
 * Generate timestamp for filename: yyyy_mm_dd-hh_mm_ss
 */
function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}_${mm}_${dd}-${hh}_${min}_${ss}`;
}

const outputArg = process.argv[2];
const timestamp = getTimestamp();
const defaultOutput = path.join(
  process.cwd(),
  "db",
  `cdb_dump-tursodb-${timestamp}.sqlite3`
);
const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : defaultOutput;

/**
 * Convert Turso libsql:// URL to https:// URL for the dump endpoint
 */
function getTursoDumpUrl(libsqlUrl) {
  // libsql://your-database.turso.io -> https://your-database.turso.io/dump
  const httpsUrl = libsqlUrl.replace("libsql://", "https://");
  return `${httpsUrl}/dump`;
}

/**
 * Download the database dump from Turso using the /dump endpoint
 */
function downloadDump(url, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    console.log(`Requesting dump from: ${url}`);

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(
          new Error(
            `Failed to download dump: HTTP ${res.statusCode} ${res.statusMessage}`
          )
        );
        return;
      }

      const chunks = [];
      let totalBytes = 0;

      res.on("data", (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
        process.stdout.write(
          `\rDownloading: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`
        );
      });

      res.on("end", () => {
        console.log("\nDownload complete.");
        resolve(Buffer.concat(chunks));
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

async function exportTursoDatabase() {
  console.log("Starting Turso database export using /dump endpoint...");
  console.log(`Turso URL: ${tursoUrl}`);
  console.log(`Output file: ${outputPath}`);

  const dirName = path.dirname(outputPath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  try {
    const dumpUrl = getTursoDumpUrl(tursoUrl);
    const dumpData = await downloadDump(dumpUrl, tursoToken);

    // Write SQL dump file
    const sqlDumpPath = outputPath.replace(/\.sqlite3?$/, ".sql");
    console.log(`\nWriting SQL dump to: ${sqlDumpPath}`);
    fs.writeFileSync(sqlDumpPath, dumpData);
    console.log(
      `SQL dump saved: ${(dumpData.length / 1024 / 1024).toFixed(2)} MB`
    );

    // Create SQLite database file from the dump
    console.log(`\nCreating SQLite database: ${outputPath}`);

    // Remove existing database if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    // Import SQL dump into new SQLite database
    try {
      execSync(`sqlite3 "${outputPath}" < "${sqlDumpPath}"`, {
        stdio: "pipe",
        shell: true,
      });

      const dbStats = fs.statSync(outputPath);
      console.log(
        `SQLite database created: ${(dbStats.size / 1024 / 1024).toFixed(2)} MB`
      );
    } catch (sqliteError) {
      console.error("\nWarning: Could not create SQLite database file.");
      console.error("Make sure sqlite3 is installed on your system.");
      console.error(
        "You can manually create it using: sqlite3 database.db < dump.sql"
      );
    }

    console.log("\n✓ Export complete.");
    console.log(`  SQL dump: ${sqlDumpPath}`);
    console.log(`  SQLite DB: ${outputPath}`);
  } catch (error) {
    console.error("Export failed:", error.message);
    process.exitCode = 1;
  }
}

exportTursoDatabase().catch((error) => {
  console.error("Unexpected error during export:", error);
  process.exit(1);
});
