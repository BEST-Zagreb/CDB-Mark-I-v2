# Company Database (Mark I v2)

## Description

Company Database (CDB) is a lightweight admin application for managing organizations, projects and collaborations. It provides an administrative UI to:

- Create, read, update and delete companies and their contacts
- Manage projects and associate collaborations with companies and projects
- Track collaboration status, responsible persons, contact history and achieved values

The app is built with Next.js (App Router), TypeScript, React Query for data fetching, React Hook Form + Zod for form validation, and a local SQLite database for storage. It's intentionally simple and optimized for internal use by teams managing outreach, partnerships and project tracking.

## Link

Deployed and available on [https://new.cdb.best.hr](https://new.cdb.best.hr)

## Visuals

<p align="center">
  <img width="90%" src="https://github.com/user-attachments/assets/56afa2df-c77f-454a-93c7-34331ebc2a7d" alt="Company Database - Home page"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/3ee9717a-4140-4c49-8fd4-765ba9dd7491" alt="Company Database - Projects"/>

  <img width="45%" src="https://github.com/user-attachments/assets/6ca24d56-63de-4167-bf97-24ebbbe8e0c9" alt="Company Database - Projects details"/>

  <img width="45%" src="https://github.com/user-attachments/assets/5d6ee205-2a60-4660-8530-36602c22dcf6" alt="Company Database - Companies"/>
  
  <img width="45%" src="https://github.com/user-attachments/assets/f670ec65-b195-42d4-9315-aa0417e46db8" alt="Company Database - Company details"/>

  <img width="45%" src="https://github.com/user-attachments/assets/5f767958-e859-45ed-a1af-65856fd3d21c" alt="Company Database - User details"/>
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
3. **Enter a database name** (e.g., `company-database`) and select your preferred location (EU)
4. **Click "Create"** to create the database
5. **Copy the Database URL** (it will look like `libsql://your-database-name.turso.io`)

#### Create an Authentication Token

1. In your database overview page **Click "Generate token"**
2. **Copy the generated token**

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

The application uses Drizzle ORM with a Turso (LibSQL) database. The schema includes:

- **companies** - Organization information
- **projects** - Project tracking
- **people** - Contact persons (linked to companies)
- **collaborations** - Partnership tracking between companies (contacts) and projects
- **app_users** - Application user profiles with roles
- **user, session, account, verification** - Better Auth authentication tables

#### Option A: Fresh Database (No Migration)

If you're starting fresh, simply run:

```bash
# Push Drizzle schema to Turso (creates all tables)
./db/scripts/run-migration.sh push
```

#### Option B: Migrate from Existing SQLite Database

If you have existing data from a local SQLite database or remote server, follow the **Database Migration Guide** below.

### 5. Run the Application

```bash
# Start development server
pnpm run dev
```

The app will be available at: **http://localhost:3000**

## Database Migration Guide

### Prerequisites for Migration

- Existing SQLite database file (`.sqlite3`)
- Turso account with database and token
- Node.js with `better-sqlite3` package installed

### Step-by-Step Migration Process

#### Step 1: Copy Database from Remote Server (if applicable)

If your database is on a remote server, copy it to your local machine:

```bash
# Copy database from server to local Desktop
scp user@vps_ip:/var/www/html/companydb/db/development.sqlite3 ~/Desktop/db.sqlite3

# Copy to project db folder
cp ~/Desktop/db.sqlite3 ./db/db.sqlite3
```

#### Step 2: Prepare Local Database

Run preparation scripts on your local SQLite database:

```bash
# 1. Normalize the database (clean up data)
node db/scripts/normalize_db.js

# 2. Enable cascading deletes (for referential integrity)
node db/scripts/enable_cascading_deletes.js

# 3. Optional: Analyze database structure
node db/scripts/analyze_db_cardinality.js
```

#### Step 3: Configure Environment Variables

Ensure your `.env.local` file has the correct Turso credentials (copy from .env.local.example):

#### Step 4: Migrate Business Data to Turso

Run the migration script to copy your companies, projects, contacts, and collaborations:

```bash
# Set environment variables and run migration
TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) \
TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) \
node db/scripts/migrate_to_turso.js
```

This will migrate:

- ✅ Companies
- ✅ Projects
- ✅ Contacts (people)
- ✅ Collaborations
- ✅ All indexes

#### Step 5: Create Authentication Tables

Add Better Auth tables for user authentication:

```bash
# Create auth tables (user, session, account, verification, app_users)
TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) \
TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) \
node db/scripts/add-auth-tables.js
```

#### Step 6: Verify Migration

Check that all tables exist:

```bash
# Verify all tables were created
TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) \
TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) \
node db/scripts/verify-tables.js
```

You should see:

- ✅ companies
- ✅ projects
- ✅ people
- ✅ collaborations
- ✅ app_users
- ✅ user, session, account, verification (Better Auth)

#### Step 7: Deploy to Production

1. **Update Netlify environment variables** with production Turso credentials
2. **Update `BETTER_AUTH_URL`** to your deployment URL:
   ```
   BETTER_AUTH_URL=https://cdb.best.hr
   ```
3. **Deploy** your application

# How to run

## Prerequisites

- **Node.js 22.19.0+** (or latest LTS)
- **pnpm** (recommended) or npm/yarn
  ```bash
  npm install -g pnpm
  ```

## Enviroment variables

Create .env.local from .env.local.example

### 1. Turso DB

#### Create a Turso Account

1. Go to [Turso](https://turso.tech/) and sign up for an account
2. Verify your email address

#### Create a Database via Web Interface

1. **Log in** to your Turso account at [https://app.turso.tech](https://app.turso.tech)
2. **Click "Create database"** in the dashboard
3. **Enter a database name** (e.g., `company-database`) and select your preferred location
4. **Click "Create"** to create the database
5. **Copy the Database URL** from the database details page (it should look like `libsql://your-database-name.turso.io`)

#### Create an Authentication Token

1. In your database overview page **Click "Generate token"**
2. **Copy the generated token**

### Better auth

Set better auth url to url of your app (http://localhost:3000 for local development)

Go to https://www.better-auth.com/docs/installation and generate better auth secret

### Google OAuth

...

## Database setup

### Option 1. - Copying an already existing db (migrating old CDB data to new CDB)

scp from vps

cp db to db/db.sqlite3

run scripts for normalizing the data...
Available utility scripts in `db/scripts/`:

### Migration Scripts

- **`migrate_to_turso.js`** - Migrate business data from local SQLite to Turso
- **`add-auth-tables.js`** - Create Better Auth tables in Turso
- **`verify-tables.js`** - Verify all tables exist in Turso

### Preparation Scripts

- **`normalize_db.js`** - Database normalization utilities
- **`enable_cascading_deletes.js`** - Enable cascading deletes
- **`analyze_db_cardinality.js`** - Analyze database relationships

### Utility Scripts

- **`run-migration.sh`** - Helper script to run Drizzle commands with environment variables
  ```bash
  ./db/scripts/run-migration.sh push    # Apply schema changes
  ./db/scripts/run-migration.sh studio  # Open Drizzle Studio
  ./db/scripts/run-migration.sh generate # Generate migrations
  ```

migrate the data to turso

create missing tables for users and better-auth

### Option 2. - Creating a new db schema from scratch

## Run the application

```bash
# Start development server
pnpm run dev
```

The app will be available at: **http://localhost:3000**

# How to deploy (on Netlify)

Test build locally (optional)

```bash
# Build the application
pnpm run build
```

Create an account on netlify

Connect account to github

Import a project from github (for continuos deployment after every push to main)

Update env variables

1. Copy from .env.local as contains secret values:

   - TURSO_DB_URL
   - TURSO_DB_TOKEN
   - BETTER_AUTH_SECRET
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET

2. Add an env variable with key BETTER_AUTH_URL and value of your app url (for example `https://cdb.best.hr` or `https://cdb.netlify.app`)

Setup DNS (optional)
If you have a valid domain, setup Cloudflare DNS with a NS records (there should be 4) that points from your domain (for example `cdb(.best.hr)`) to your account netlify namespace servers (it should look like `dns1.p07.nsone.net`)

In netlify project dashboard under Domain management add domain alias for example `cdb.best.hr` and add SSL/TLS certificate so your app can be accessed through HTTPS.
NOTE: Don't forget to update the values for BETTER_AUTH_URL and in Google OAuth when changing domains.

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
