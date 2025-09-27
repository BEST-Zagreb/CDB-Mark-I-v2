# Company Database (Mark I v2)

## Description

Company Database (CDB) is a lightweight admin application for managing organizations, projects and collaborations. It provides an administrative UI to:

- Create, read, update and delete companies and their contacts
- Manage projects and associate collaborations with companies and projects
- Track collaboration status, responsible persons, contact history and achieved values

The app is built with Next.js (App Router), TypeScript, React Query for data fetching, React Hook Form + Zod for form validation, and a local SQLite database for storage. It's intentionally simple and optimized for internal use by teams managing outreach, partnerships and project tracking.

## Link

Deployed and available on: _[coming soon](#)_

## Visuals

<p align="center">
  <img width="90%" src="https://pic.pnnet.dev/960x540" alt="Company Database - Home page"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Company Database - Projects"/>

  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Company Database - Company details"/>

  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Company Database - Projects details"/>

  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Company Database - Company details"/>

  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Company Database - Company details 2 (collaborations)"/>
</p>

## Attribution

**Created by: Jakov Jakovac**

## License [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-cyan.svg

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

## How to run

### Prerequisites

- **Node.js 22.19.0+** (or latest LTS) - [Download here](https://nodejs.org/)
- **pnpm** (recommended) or npm/yarn
  ```bash
  npm install -g pnpm
  ```

### 1. Turso Database Setup

#### Create a Turso Account

1. Go to [Turso](https://turso.tech/) and sign up for an account
2. Verify your email address

#### Create a Database via Web Interface

1. **Log in** to your Turso account at [https://app.turso.tech](https://app.turso.tech)
2. **Click "Create database"** in the dashboard
3. **Enter a database name** (e.g., `company-database`) and select your preferred location
4. **Click "Create"** to create the database
5. **Copy the Database URL** from the database details page (it will look like `libsql://your-database-name.turso.io`)

#### Create an Authentication Token

1. In your database details page, go to the **"Tokens"** tab
2. **Click "Generate token"**
3. **Copy the generated token** (save this securely - you'll need it for your environment variables)
4. **Note:** Keep this token private and never commit it to version control

### 2. Environment Setup

1. **Copy the environment template:**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` and add your Turso credentials:**
   ```bash
   # Replace with your actual database URL and token
   TURSO_DB_URL=libsql://your-database-url.turso.io
   TURSO_DB_TOKEN=your-database-token-here
   ```

### 3. Install Dependencies

```bash
# Install main dependencies
pnpm install

# Install better-sqlite3 for database scripts (requires native compilation)
npm install better-sqlite3 --build-from-source
```

**Note:** The second command installs `better-sqlite3` with native bindings required for the database utility scripts. This package needs to be compiled for your specific platform and Node.js version.

### 4. Database Schema Setup

The application will automatically create the required database schema when it first runs. The schema includes:

- **companies** - Organization information
- **projects** - Project tracking
- **people** - Contact persons (linked to companies)
- **collaborations** - Partnership tracking between companies (contacts) and projects

If you have existing data from a local SQLite database, you can migrate it using the provided script (db.sqlite3 file should be located in folder (root)/db):

```bash
# Make sure your .env.local is configured first
node db/scripts/migrate_to_turso.js
```

### 5. Run the Application

```bash
# Start development server
pnpm run dev
```

The app will be available at: **http://localhost:3000**

### 6. Build for Production

```bash
# Build the application
pnpm run build
```

## Database Scripts

Available utility scripts in `db/scripts/`:

- `migrate_to_turso.js` - Migrate data from local SQLite to Turso
- `normalize_db.js` - Database normalization utilities
- `enable_cascading_deletes.js` - Enable cascading deletes
- `analyze_db_cardinality.js` - Analyze database relationships

## How to contribute

Contributions are welcome — whether it's a bug report, feature idea, documentation improvement or code change. Below are guidelines to make the process smooth for everyone.

### Reporting bugs & suggesting ideas

- Search existing issues before opening a new one to avoid duplicates.
- Create a new issue and include:
  - A clear title and description of the problem or idea.
  - Steps to reproduce (for bugs) and expected vs actual behavior.
  - Environment details (OS, Java/Maven/Node versions, Postgres version, browser) if relevant.
  - Attach screenshots, logs or example requests/responses when helpful.
- Use labels if available (bug, enhancement, question, docs).

### Contributing code (pull requests)

1. Fork the repository and create a feature branch from `master`:
   - Branch name example: `feat/add-search-by-country` or `fix/company-null-pointer`.
2. Follow project coding style:
   - follow existing TypeScript/React patterns, use Prettier extension and linting rules.
3. Run tests and build locally before creating a PR:
   - `pnpm install && pnpm dev` (and run any available tests/lint scripts).
4. Commit messages should be concise and descriptive. Reference related issue numbers in the PR or commit message.
5. Open a pull request against the `master` branch and include:
   - A summary of changes, why they were made, and any migration steps.
   - Screenshots or short recordings for UI changes.
   - Links to related issues.

### Troubleshooting

#### Database Connection Issues

**Error: "TURSO_DB_URL and TURSO_DB_TOKEN environment variables are required"**

- Make sure `.env.local` exists and contains the correct values
- Verify your Turso database URL and token are correct
- Check that the token hasn't expired

**Error: "SQL not allowed statement: PRAGMA cache_size = -128000"**

- This error indicates you're using an older version of the database setup
- The application has been updated to work with Turso's restrictions on PRAGMA statements
- Make sure you're using the latest code from the repository

#### Build Issues

**TypeScript compilation errors**

```bash
# Clear Next.js cache and rebuild
rm -rf .next
pnpm run build
```

**Port already in use**

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
pnpm run dev -- -p 3001
```

#### Database Migration Issues

**Migration script fails**

- Ensure your local SQLite database exists at `db/db.sqlite3`
- Verify environment variables are set correctly
- Check that you have read permissions for the local database

**Data verification fails after migration**

- Check the migration script output for specific error messages
- Verify table schemas match between local and Turso databases
- Ensure foreign key constraints are satisfied
