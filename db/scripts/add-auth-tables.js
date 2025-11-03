#!/usr/bin/env node

/**
 * Add Better Auth tables to existing Turso database
 * This script creates only the missing auth tables without touching existing data
 */

const { createClient } = require("@libsql/client");

const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error(
    "❌ TURSO_DB_URL and TURSO_DB_TOKEN environment variables are required"
  );
  process.exit(1);
}

async function addAuthTables() {
  console.log("🚀 Adding Better Auth tables to Turso database...\n");

  const tursoDb = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  try {
    // Create app_users table
    console.log("📝 Creating app_users table...");
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        added_by TEXT,
        last_login TEXT,
        is_locked INTEGER NOT NULL DEFAULT 0
      )
    `);
    console.log("✅ app_users table created");

    // Create indexes for app_users
    await tursoDb.execute(
      `CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email)`
    );
    await tursoDb.execute(
      `CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role)`
    );
    await tursoDb.execute(
      `CREATE INDEX IF NOT EXISTS idx_app_users_full_name ON app_users(full_name)`
    );
    await tursoDb.execute(
      `CREATE INDEX IF NOT EXISTS idx_app_users_last_login ON app_users(last_login)`
    );
    await tursoDb.execute(
      `CREATE INDEX IF NOT EXISTS idx_app_users_is_locked ON app_users(is_locked)`
    );
    console.log("✅ app_users indexes created");

    // Create user table (Better Auth)
    console.log("\n📝 Creating Better Auth tables...");
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);
    console.log("✅ user table created");

    // Create session table
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        expiresAt INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ session table created");

    // Create account table
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt INTEGER,
        refreshTokenExpiresAt INTEGER,
        scope TEXT,
        password TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ account table created");

    // Create verification table
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER,
        updatedAt INTEGER
      )
    `);
    console.log("✅ verification table created");

    console.log("\n🎉 All Better Auth tables created successfully!");
    console.log("\n📋 Database structure:");
    console.log("  Business tables:");
    console.log("    • companies");
    console.log("    • projects");
    console.log("    • people");
    console.log("    • collaborations");
    console.log("  Auth tables:");
    console.log("    • app_users (custom)");
    console.log("    • user (Better Auth)");
    console.log("    • session (Better Auth)");
    console.log("    • account (Better Auth)");
    console.log("    • verification (Better Auth)");

    console.log("\n✅ Ready for user authentication!");
    console.log(
      "   Sign in with Google to create your first user, then set role to Administrator."
    );

    await tursoDb.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addAuthTables();
