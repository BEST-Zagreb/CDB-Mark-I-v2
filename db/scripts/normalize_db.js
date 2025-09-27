#!/usr/bin/env node

/**
 * Database migration script with multiple migration functions
 * Run specific migrations using: node migrate_db.js <migration-name>
 * Run all migrations using: node migrate_db.js all
 *
 * Available migrations:
 * - prio: Standardize collaboration priority values
 * - country: Normalize country names in companies table
 * - goal: Round fr_goal values in projects table to full numbers
 * - month: Standardize budgeting_month values to English format
 * - bool: Standardize boolean columns in collaborations table
 * - amount: Round amount values in collaborations table to whole numbers
 * - type: Standardize collaboration type values to English
 * - inv_cif: Invert contact_in_future boolean values (1↔0)
 */

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "db", "db.sqlite3");

// Migration functions
const migrations = {
  /**
   * Standardize collaboration priority values
   * Converts numeric and inconsistent string values to standardized strings
   */
  prio: async (db) => {
    console.log("🔄 Starting priority standardization...");

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

    // Define the priority mappings
    const updates = [
      { from: "1", to: "Low" },
      { from: "2", to: "Low" },
      { from: "3", to: "Medium" },
      { from: "4", to: "High" },
      { from: "5", to: "High" },
      { from: null, to: "Medium" }, // Optional: set null priorities to 'Medium'
      { from: "t", to: "High" },
      { from: "f", to: "Low" },
      { from: "low", to: "Low" },
      { from: "medium", to: "Medium" },
      { from: "high", to: "High" },
    ];

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
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

    console.log("\n🚀 Executing priority migration...");
    const updatedCount = migrateTransaction();

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

    console.log(`\n✅ Priority migration completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Normalize country names in companies table
   * Standardizes various misspellings and abbreviations to proper country names (case insensitive)
   */
  country: async (db) => {
    console.log("🔄 Starting country name normalization...");

    // Check current country values
    const currentCountries = db
      .prepare(
        `
      SELECT DISTINCT country, COUNT(*) as count
      FROM companies
      WHERE country IS NOT NULL AND TRIM(country) != ''
      GROUP BY country
      ORDER BY country
    `
      )
      .all();

    console.log("\n📊 Current country values:");
    currentCountries.forEach((row) => {
      console.log(`  "${row.country}": ${row.count} records`);
    });

    // Define country name mappings (case insensitive)
    const countryMappings = {
      // Croatia variations -> Croatia
      hrvatska: "Croatia",
      rvatska: "Croatia",
      croatia: "Croatia",
      hr: "Croatia",
      hrv: "Croatia",
      hrvarska: "Croatia",
      hrvatsla: "Croatia",
      rh: "Croatia",
      "republika hrvatska": "Croatia",
      zagreb: "Croatia", // Assuming Zagreb is in Croatia
      10000: "Croatia", // This looks like a postal code, probably Croatian
      "'rvatska": "Croatia", // Handle quoted variations

      // Bosnia and Herzegovina
      bih: "Bosnia and Herzegovina",

      // Germany
      njemačka: "Germany",

      // Other countries to English names
      "sjedinjene američke države": "United States",
      slovenija: "Slovenia",
      srbija: "Serbia",
      "ujedinjeno kraljevstvo": "United Kingdom",
      finska: "Finland",
    };

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      Object.entries(countryMappings).forEach(([from, to]) => {
        // Update case-insensitive matches using LOWER()
        const result = db
          .prepare(
            `
          UPDATE companies
          SET country = ?
          WHERE LOWER(TRIM(country)) = LOWER(?)
          AND country != ?
        `
          )
          .run(to, from, to);

        if (result.changes > 0) {
          console.log(
            `  ✅ Updated ${result.changes} records from "${from}" to "${to}"`
          );
          totalUpdated += result.changes;
        }
      });

      return totalUpdated;
    });

    console.log("\n🚀 Executing country normalization...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    const newCountries = db
      .prepare(
        `
      SELECT DISTINCT country, COUNT(*) as count
      FROM companies
      WHERE country IS NOT NULL AND TRIM(country) != ''
      GROUP BY country
      ORDER BY country
    `
      )
      .all();

    console.log("\n📊 Updated country values:");
    newCountries.forEach((row) => {
      console.log(`  "${row.country}": ${row.count} records`);
    });

    console.log(`\n✅ Country normalization completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Round fr_goal values in projects table to full numbers
   * Converts decimal values like 10000.01 to 10000
   */
  goal: async (db) => {
    console.log("🔄 Starting fr_goal rounding...");

    // Check current fr_goal values
    const currentGoals = db
      .prepare(
        `
      SELECT DISTINCT fr_goal, COUNT(*) as count
      FROM projects
      WHERE fr_goal IS NOT NULL
      GROUP BY fr_goal
      ORDER BY fr_goal
    `
      )
      .all();

    console.log("\n📊 Current fr_goal values:");
    currentGoals.forEach((row) => {
      console.log(`  ${row.fr_goal}: ${row.count} records`);
    });

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      // Find all projects with decimal fr_goal values
      const projectsWithDecimals = db
        .prepare(
          `
        SELECT id, fr_goal
        FROM projects
        WHERE fr_goal IS NOT NULL
          AND fr_goal != ROUND(fr_goal)
      `
        )
        .all();

      projectsWithDecimals.forEach((project) => {
        const roundedGoal = Math.round(project.fr_goal);

        const result = db
          .prepare(
            `
          UPDATE projects
          SET fr_goal = ?
          WHERE id = ?
        `
          )
          .run(roundedGoal, project.id);

        if (result.changes > 0) {
          totalUpdated += result.changes;
        }
      });

      if (projectsWithDecimals.length > 0) {
        console.log(
          `  ✅ Rounded ${projectsWithDecimals.length} decimal fr_goal values to whole numbers`
        );
      }

      return totalUpdated;
    });

    console.log("\n🚀 Executing fr_goal rounding...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    const newGoals = db
      .prepare(
        `
      SELECT DISTINCT fr_goal, COUNT(*) as count
      FROM projects
      WHERE fr_goal IS NOT NULL
      GROUP BY fr_goal
      ORDER BY fr_goal
    `
      )
      .all();

    console.log("\n📊 Updated fr_goal values:");
    newGoals.forEach((row) => {
      console.log(`  ${row.fr_goal}: ${row.count} records`);
    });

    console.log(`\n✅ fr_goal rounding completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Standardize budgeting_month values in companies table to English format
   * Converts Croatian month names to "01 - January" format
   */
  month: async (db) => {
    console.log("🔄 Starting budgeting_month standardization...");

    // Check current budgeting_month values
    const currentMonths = db
      .prepare(
        `
      SELECT DISTINCT budgeting_month, COUNT(*) as count
      FROM companies
      WHERE budgeting_month IS NOT NULL AND TRIM(budgeting_month) != ''
      GROUP BY budgeting_month
      ORDER BY budgeting_month
    `
      )
      .all();

    console.log("\n📊 Current budgeting_month values:");
    currentMonths.forEach((row) => {
      console.log(`  "${row.budgeting_month}": ${row.count} records`);
    });

    // Define Croatian to English month mappings
    const monthMappings = {
      // Croatian month names (lowercase for case-insensitive matching)
      siječanj: "01 - January",
      veljača: "02 - February",
      ožujak: "03 - March",
      travanj: "04 - April",
      svibanj: "05 - May",
      lipanj: "06 - June",
      srpanj: "07 - July",
      kolovoz: "08 - August",
      rujan: "09 - September",
      listopad: "10 - October",
      studeni: "11 - November",
      prosinac: "12 - December",

      // Already formatted Croatian months (with numbers)
      "01 - siječanj": "01 - January",
      "02 - veljača": "02 - February",
      "03 - ožujak": "03 - March",
      "04 - travanj": "04 - April",
      "05 - svibanj": "05 - May",
      "06 - lipanj": "06 - June",
      "07 - srpanj": "07 - July",
      "08 - kolovoz": "08 - August",
      "09 - rujan": "09 - September",
      "10 - listopad": "10 - October",
      "11 - studeni": "11 - November",
      "12 - prosinac": "12 - December",
    };

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      Object.entries(monthMappings).forEach(([from, to]) => {
        // Update case-insensitive matches
        const result = db
          .prepare(
            `
          UPDATE companies
          SET budgeting_month = ?
          WHERE LOWER(TRIM(budgeting_month)) = LOWER(?)
          AND budgeting_month != ?
        `
          )
          .run(to, from, to);

        if (result.changes > 0) {
          console.log(
            `  ✅ Updated ${result.changes} records from "${from}" to "${to}"`
          );
          totalUpdated += result.changes;
        }
      });

      return totalUpdated;
    });

    console.log("\n🚀 Executing budgeting_month standardization...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    const newMonths = db
      .prepare(
        `
      SELECT DISTINCT budgeting_month, COUNT(*) as count
      FROM companies
      WHERE budgeting_month IS NOT NULL AND TRIM(budgeting_month) != ''
      GROUP BY budgeting_month
      ORDER BY budgeting_month
    `
      )
      .all();

    console.log("\n📊 Updated budgeting_month values:");
    newMonths.forEach((row) => {
      console.log(`  "${row.budgeting_month}": ${row.count} records`);
    });

    console.log(`\n✅ Budgeting_month standardization completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Standardize boolean columns in collaborations table
   * Converts mixed boolean formats (0/1/f/t) to consistent true/false
   */
  bool: async (db) => {
    console.log("🔄 Starting boolean column standardization...");

    // Define the boolean columns to standardize
    const booleanColumns = [
      "contacted",
      "successful",
      "letter",
      "meeting",
      "contact_in_future",
    ];

    let totalUpdated = 0;

    // Check current values for each boolean column
    console.log("\n📊 Current boolean column values:");
    booleanColumns.forEach((column) => {
      const currentValues = db
        .prepare(
          `
        SELECT DISTINCT ${column}, COUNT(*) as count
        FROM collaborations
        WHERE ${column} IS NOT NULL
        GROUP BY ${column}
        ORDER BY ${column}
      `
        )
        .all();

      console.log(`  ${column}:`);
      currentValues.forEach((row) => {
        console.log(`    ${row[column]}: ${row.count} records`);
      });
    });

    // Define boolean value mappings (convert to integers for SQLite)
    const booleanMappings = {
      1: 1, // 1 -> 1 (true)
      0: 0, // 0 -> 0 (false)
      t: 1, // 't' -> 1 (true)
      f: 0, // 'f' -> 0 (false)
    };

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      booleanColumns.forEach((column) => {
        Object.entries(booleanMappings).forEach(([from, to]) => {
          const result = db
            .prepare(
              `
            UPDATE collaborations
            SET ${column} = ?
            WHERE ${column} = ?
          `
            )
            .run(to, from);

          if (result.changes > 0) {
            console.log(
              `  ✅ Updated ${result.changes} records in ${column}: ${from} → ${to}`
            );
            totalUpdated += result.changes;
          }
        });
      });

      return totalUpdated;
    });

    console.log("\n🚀 Executing boolean standardization...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    console.log("\n📊 Updated boolean column values:");
    booleanColumns.forEach((column) => {
      const newValues = db
        .prepare(
          `
        SELECT DISTINCT ${column}, COUNT(*) as count
        FROM collaborations
        WHERE ${column} IS NOT NULL
        GROUP BY ${column}
        ORDER BY ${column}
      `
        )
        .all();

      console.log(`  ${column}:`);
      newValues.forEach((row) => {
        console.log(`    ${row[column]}: ${row.count} records`);
      });
    });

    console.log(`\n✅ Boolean standardization completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Round amount values in collaborations table to whole numbers
   * Converts decimal values like 100.50 to 101 (rounded)
   */
  amount: async (db) => {
    console.log("🔄 Starting amount rounding...");

    // Check current amount values
    const currentAmounts = db
      .prepare(
        `
      SELECT DISTINCT amount, COUNT(*) as count
      FROM collaborations
      WHERE amount IS NOT NULL
      GROUP BY amount
      ORDER BY amount
    `
      )
      .all();

    console.log("\n📊 Current amount values:");
    currentAmounts.slice(0, 20).forEach((row) => {
      console.log(`  ${row.amount}: ${row.count} records`);
    });
    if (currentAmounts.length > 20) {
      console.log(`  ... and ${currentAmounts.length - 20} more values`);
    }

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      // Find all collaborations with decimal amount values
      const collaborationsWithDecimals = db
        .prepare(
          `
        SELECT id, amount
        FROM collaborations
        WHERE amount IS NOT NULL
          AND amount != ROUND(amount)
      `
        )
        .all();

      collaborationsWithDecimals.forEach((collaboration) => {
        const roundedAmount = Math.round(collaboration.amount);

        const result = db
          .prepare(
            `
          UPDATE collaborations
          SET amount = ?
          WHERE id = ?
        `
          )
          .run(roundedAmount, collaboration.id);

        if (result.changes > 0) {
          totalUpdated += result.changes;
        }
      });

      if (collaborationsWithDecimals.length > 0) {
        console.log(
          `  ✅ Rounded ${collaborationsWithDecimals.length} decimal amount values to whole numbers`
        );
      }

      return totalUpdated;
    });

    console.log("\n🚀 Executing amount rounding...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    const newAmounts = db
      .prepare(
        `
      SELECT DISTINCT amount, COUNT(*) as count
      FROM collaborations
      WHERE amount IS NOT NULL
      GROUP BY amount
      ORDER BY amount
    `
      )
      .all();

    console.log("\n📊 Updated amount values (first 20):");
    newAmounts.slice(0, 20).forEach((row) => {
      console.log(`  ${row.amount}: ${row.count} records`);
    });
    if (newAmounts.length > 20) {
      console.log(`  ... and ${newAmounts.length - 20} more values`);
    }

    console.log(`\n✅ Amount rounding completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Standardize collaboration type values to English
   * Converts Croatian type names to English equivalents
   */
  type: async (db) => {
    console.log("🔄 Starting collaboration type standardization...");

    // Check current type values
    const currentTypes = db
      .prepare(
        `
      SELECT DISTINCT type, COUNT(*) as count
      FROM collaborations
      WHERE type IS NOT NULL AND TRIM(type) != ''
      GROUP BY type
      ORDER BY type
    `
      )
      .all();

    console.log("\n📊 Current collaboration type values:");
    currentTypes.forEach((row) => {
      console.log(`  "${row.type}": ${row.count} records`);
    });

    // Define type mappings (Croatian to English)
    const typeMappings = {
      financijska: "Financial",
      materijalna: "Material",
      edukacija: "Educational",
    };

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      Object.entries(typeMappings).forEach(([from, to]) => {
        // Update case-insensitive matches
        const result = db
          .prepare(
            `
          UPDATE collaborations
          SET type = ?
          WHERE LOWER(TRIM(type)) = LOWER(?)
          AND type != ?
        `
          )
          .run(to, from, to);

        if (result.changes > 0) {
          console.log(
            `  ✅ Updated ${result.changes} records from "${from}" to "${to}"`
          );
          totalUpdated += result.changes;
        }
      });

      return totalUpdated;
    });

    console.log("\n🚀 Executing collaboration type standardization...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    const newTypes = db
      .prepare(
        `
      SELECT DISTINCT type, COUNT(*) as count
      FROM collaborations
      WHERE type IS NOT NULL AND TRIM(type) != ''
      GROUP BY type
      ORDER BY type
    `
      )
      .all();

    console.log("\n📊 Updated collaboration type values:");
    newTypes.forEach((row) => {
      console.log(`  "${row.type}": ${row.count} records`);
    });

    console.log(
      `\n✅ Collaboration type standardization completed successfully!`
    );
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },

  /**
   * Invert contact_in_future boolean values
   * Switches 1 to 0 and 0 to 1 for the contact_in_future column
   */
  inv_cif: async (db) => {
    console.log("🔄 Starting contact_in_future inversion...");

    // Check current contact_in_future values
    const currentValues = db
      .prepare(
        `
      SELECT DISTINCT contact_in_future, COUNT(*) as count
      FROM collaborations
      WHERE contact_in_future IS NOT NULL
      GROUP BY contact_in_future
      ORDER BY contact_in_future
    `
      )
      .all();

    console.log("\n📊 Current contact_in_future values:");
    currentValues.forEach((row) => {
      console.log(`  ${row.contact_in_future}: ${row.count} records`);
    });

    let totalUpdated = 0;

    // Execute updates in a transaction
    const migrateTransaction = db.transaction(() => {
      // Invert 1 to 0
      const result1to0 = db
        .prepare(
          `
        UPDATE collaborations
        SET contact_in_future = 0
        WHERE contact_in_future = 1
      `
        )
        .run();

      if (result1to0.changes > 0) {
        console.log(`  ✅ Inverted ${result1to0.changes} records from 1 to 0`);
        totalUpdated += result1to0.changes;
      }

      // Invert 0 to 1
      const result0to1 = db
        .prepare(
          `
        UPDATE collaborations
        SET contact_in_future = 1
        WHERE contact_in_future = 0
      `
        )
        .run();

      if (result0to1.changes > 0) {
        console.log(`  ✅ Inverted ${result0to1.changes} records from 0 to 1`);
        totalUpdated += result0to1.changes;
      }

      return totalUpdated;
    });

    console.log("\n🚀 Executing contact_in_future inversion...");
    const updatedCount = migrateTransaction();

    // Verify the migration
    const newValues = db
      .prepare(
        `
      SELECT DISTINCT contact_in_future, COUNT(*) as count
      FROM collaborations
      WHERE contact_in_future IS NOT NULL
      GROUP BY contact_in_future
      ORDER BY contact_in_future
    `
      )
      .all();

    console.log("\n📊 Updated contact_in_future values:");
    newValues.forEach((row) => {
      console.log(`  ${row.contact_in_future}: ${row.count} records`);
    });

    console.log(`\n✅ Contact_in_future inversion completed successfully!`);
    console.log(`📈 Total records updated: ${updatedCount}`);

    return updatedCount;
  },
};

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node migrate_db.js <migration-name> | all

Available migrations:
${Object.keys(migrations)
  .map((name) => `  - ${name}`)
  .join("\n")}

Examples:
  node migrate_db.js prio
  node migrate_db.js all
    `);
    process.exit(0);
  }

  const migrationName = args[0];

  if (migrationName === "all") {
    console.log(`🔄 Starting all database migrations`);
    console.log(`📁 Database: ${dbPath}`);

    try {
      const db = new Database(dbPath);
      const migrationNames = Object.keys(migrations);
      let totalMigrations = migrationNames.length;
      let completedMigrations = 0;
      let totalRecordsUpdated = 0;

      console.log(
        `\n🚀 Running ${totalMigrations} migrations in sequence...\n`
      );

      for (const name of migrationNames) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `🔄 Migration ${completedMigrations + 1}/${totalMigrations}: ${name}`
        );
        console.log(`${"=".repeat(60)}`);

        try {
          const recordsUpdated = await migrations[name](db);
          totalRecordsUpdated += recordsUpdated || 0;
          completedMigrations++;
          console.log(`✅ Migration '${name}' completed successfully!`);
        } catch (error) {
          console.error(`❌ Migration '${name}' failed:`, error);
          db.close();
          process.exit(1);
        }
      }

      console.log(`\n${"=".repeat(60)}`);
      console.log(`🎉 All migrations completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(
        `   - Total migrations run: ${completedMigrations}/${totalMigrations}`
      );
      console.log(`   - Total records updated: ${totalRecordsUpdated}`);
      console.log(`${"=".repeat(60)}`);

      db.close();
    } catch (error) {
      console.error(`❌ Migration process failed:`, error);
      process.exit(1);
    }
    return;
  }

  if (!migrations[migrationName]) {
    console.error(`❌ Unknown migration: ${migrationName}`);
    console.log(
      `\nAvailable migrations: ${Object.keys(migrations).join(", ")}`
    );
    process.exit(1);
  }

  console.log(`🔄 Starting database migration: ${migrationName}`);
  console.log(`📁 Database: ${dbPath}`);

  try {
    const db = new Database(dbPath);

    // Run the migration
    const result = await migrations[migrationName](db);

    console.log(`\n✅ Migration '${migrationName}' completed successfully!`);

    db.close();
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}
