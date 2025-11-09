# Company Database (Mark I v2)

## Description

Company Database (CDB) is a lightweight admin application for managing organizations, projects and collaborations. It provides an administrative UI to:

- Create, read, update and delete companies and their contacts
- Manage projects and associate collaborations with companies and projects
- Track collaboration status, responsible persons, contact history and achieved values

The app is built with Next.js (App Router), TypeScript, React Query for data fetching, React Hook Form + Zod for form validation, and a local SQLite database for storage. It's intentionally simple and optimized for internal use by teams managing outreach, partnerships and project tracking.

## Link

Deployed and available on [new.cdb.best.hr](https://cdb.best.hr)

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

- **Node.js 22.19.0+** (or latest LTS)
- **pnpm** (recommended) or npm/yarn
  ```bash
  npm install -g pnpm
  ```

#### Install Dependencies

```bash
# Install main dependencies
pnpm install .
```

### Environment Setup

1. Create a `.env.local` file in the project root:
   ```bash
   cp .env.local.example .env.local
   ```
2. Configure the following services and environment variables:

   - **Optional:** Set `ALLOWED_EMAIL_DOMAINS` in `.env.local` to a comma-separated list of domains (for example `best.hr,example.com`). Only users whose email ends with one of the listed domains will be able to sign in without needing to make an account prior. Leave the value empty to disable auto-create user.

#### 1. Turso Database

##### Create a Turso Account

1. Go to [Turso](https://turso.tech/) and sign up for an account
2. Verify your email address

##### Create a Database via Web Interface

1. **Log in** to your Turso account at [https://app.turso.tech](https://app.turso.tech)
2. **Click "Create database"** in the dashboard
3. **Enter a database name** (e.g., `company-database`) and select your preferred location
4. **Click "Create"** to create the database
5. **Copy-paste the Database URL to your `.env.local` file** from the database details page (it should look like `libsql://your-database-name.turso.io`)

##### Create an Authentication Token

1. In your database overview page **Click "Generate token"**
2. **Copy-paste the generated token to your `.env.local` file**

#### 2. Better Auth Configuration

1. Set `BETTER_AUTH_URL` in your `.env.local` file to your application URL:

   - Use `http://localhost:3000` for local development
   - Use your production URL for deployment (e.g., `https://cdb.best.hr`)

2. Generate and copy-paste the `BETTER_AUTH_SECRET` from the [Better-Auth documentation](https://www.better-auth.com/docs/installation) to your `.env.local` file

#### 3. Google OAuth Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project (name for example `Company Database` and id for example `company-database`) and open it

3. Create a new OAuth client ID credential under `Open APIs & Services > Credentials`

- Configure consent screen (`Branding`)

  - Input app name (for example `Company Database`) and user support email (your account email)
  - Set Audience to External so users outside your organisation can login
  - Add contact email (your account email)

- Create OAuth client ID (`Clients`)

  - Set application type to Web application
  - Change name or leave as is
  - Add Authorized JavaScript origins (your app domain): `http://localhost:3000`, `https://cdb.best.hr`, `https://cdb.netlify.app`
  - Add Authorized redirect URIs (your app domain): `http://localhost:3000/api/auth/callback/google`, `https://cdb.best.hr/api/auth/callback/google`, `https://cdb.netlify.app/api/auth/callback/google`

4. Copy-paste Client ID and Client Secret to your `.env.local` file

5. Publish your app to Production under `Audience > Publishing status > Publish app`

### Database Setup

The application uses **Drizzle ORM** with a **Turso** (LibSQL) database. The schema includes:

| Table                                        | Description                                                    |
| -------------------------------------------- | -------------------------------------------------------------- |
| `companies`                                  | Organization information                                       |
| `projects`                                   | Project tracking                                               |
| `people`                                     | Contact persons (linked to companies)                          |
| `collaborations`                             | Partnership tracking between companies (contacts) and projects |
| `app_users`                                  | Application user profiles with roles                           |
| `user`, `session`, `account`, `verification` | Better Auth authentication tables                              |

#### Database Utility Scripts

Location: `db/scripts/`

##### DB Preparation Scripts

- **`normalize_db.js`** - Database normalization utilities
- **`enable_cascading_deletes.js`** - Enable cascading deletes
- **`analyze_db_cardinality.js`** - Analyze database relationships

##### DB Migration Scripts

- **`migrate_to_turso.js`** - Migrate business data from local SQLite to Turso
- **`add-auth-tables.js`** - Create Better Auth tables in Turso
- **`verify-tables.js`** - Verify all tables exist in Turso

##### DB Backup & Export Scripts

- **`export_turso_db.js`** - Export the full Turso database into local files

#### Option 1: Migrate Existing Database

To migrate data from an existing CDB instance, follow these steps:

##### Step 1: Copy Database from Remote Server

If your database is on a remote server, copy it to your local machine:

```bash
# Copy database from remote server to local Desktop
scp user@vps_ip:/var/www/html/companydb/db/development.sqlite3 ~/Desktop/db.sqlite3

# Copy to project db folder
cp ~/Desktop/db.sqlite3 ./db/db.sqlite3
```

##### Step 2: Switch to npm for Database Scripts

The database preparation scripts require npm (not pnpm) due to `better-sqlite3` native bindings:

```bash
# Remove pnpm artifacts
rm -rf node_modules

# Install with npm
npm install .
```

##### Step 3: Prepare Local SQLite Database

Run preparation and normalization scripts:

```bash
# Normalize the database (clean up data inconsistencies)
node db/scripts/normalize_db.js all

# Enable cascading deletes for referential integrity
node db/scripts/enable_cascading_deletes.js

# Optional: Analyze database structure
node db/scripts/analyze_db_cardinality.js
```

##### Step 4: Migrate Business Data to Turso

Migrate your companies, projects, contacts, and collaborations:

```bash
TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) node db/scripts/migrate_to_turso.js
```

##### Step 5: Create Authentication Tables

Create Better Auth tables (user, session, account, verification, app_users):

```bash
TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) node db/scripts/add-auth-tables.js
```

##### Step 6: Switch to pnpm

Remove npm artifacts and reinstall dependencies with pnpm:

```bash
# Remove npm artifacts
rm -rf node_modules package-lock.json

# Reinstall with pnpm
pnpm install .
```

#### Option 2: Fresh Database Setup

For a new installation without existing data:

```bash
# Push the Drizzle schema to Turso (creates all tables)
TURSO_DB_URL=$(grep TURSO_DB_URL .env.local | cut -d'=' -f2) TURSO_DB_TOKEN=$(grep TURSO_DB_TOKEN .env.local | cut -d'=' -f2) pnpm drizzle-kit push
```

### Running the Application

1. Start the development server:

   ```bash
   pnpm run dev
   ```

2. Access the application at: **[http://localhost:3000](http://localhost:3000)**

3. Log in with Google OAuth - the first user to sign in will be automatically created and granted the _Administrator_ role

## Deployment Guide (Netlify)

### 1. Local Build Verification (Optional)

```bash
# Build the application locally to verify everything works
pnpm run build
```

### 2. Netlify Configuration

1. **Initial Setup**

   - Create a Netlify account
   - Connect your GitHub account
   - Import your repository for continuous deployment

2. **Environment Variables**

   Copy these values as secrets from your `.env.local`:

   - `TURSO_DB_URL`
   - `TURSO_DB_TOKEN`
   - `BETTER_AUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

   Add a new variable:

   - `BETTER_AUTH_URL` - Your app's URL (e.g., `https://cdb.best.hr` or `https://cdb.netlify.app`)

### 3. Custom Domain Setup (Optional)

#### A. Cloudflare DNS Configuration

1. In your Cloudflare DNS dashboard, add **4 NS records** that point from your domain (e.g., `cdb.best.hr`) to Netlify's nameservers (format: `dnsX.p07.nsone.net`)

#### B. Netlify Domain Configuration

1. In the **Netlify project dashboard** → **Domain Management**:
   - Add your custom domain (e.g., `cdb.best.hr`)
   - Enable SSL/TLS certificate

#### C. Update Application Settings

After domain changes, update:

- Environment variable: `BETTER_AUTH_URL`
- `trustedOrigins` in `auth.ts` file
- Google OAuth settings:
  - Authorized domains
  - Redirect URIs

## How to contribute

Contributions are welcome - whether it's a bug report, feature idea, documentation improvement or code change. Below are guidelines to make the process smooth for everyone.

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
