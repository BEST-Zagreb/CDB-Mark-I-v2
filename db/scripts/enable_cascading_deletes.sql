-- Enable cascading deletes on existing SQLite database
-- Run with: sqlite3 db/db.sqlite3 < enable_cascading_deletes.sql

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create temporary tables with proper constraints
CREATE TABLE companies_temp (
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
);

CREATE TABLE projects_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  fr_goal REAL,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE people_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  company_id INTEGER,
  function TEXT,
  created_at TEXT,
  FOREIGN KEY (company_id) REFERENCES companies_temp(id) ON DELETE CASCADE
);

CREATE TABLE collaborations_temp (
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
);

-- Copy data to temp tables (parents first, then children)
-- Temporarily disable foreign key checks for data migration
PRAGMA foreign_keys = OFF;

INSERT INTO companies_temp SELECT * FROM companies;
INSERT INTO projects_temp SELECT * FROM projects;

-- Insert only people with valid company_id references
INSERT INTO people_temp
SELECT p.* FROM people p
WHERE p.company_id IN (SELECT id FROM companies_temp);

-- Insert only collaborations with valid references
INSERT INTO collaborations_temp
SELECT c.* FROM collaborations c
WHERE c.company_id IN (SELECT id FROM companies_temp)
  AND c.project_id IN (SELECT id FROM projects_temp)
  AND c.person_id IN (SELECT id FROM people_temp);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Drop old tables
DROP TABLE collaborations;
DROP TABLE people;
DROP TABLE projects;
DROP TABLE companies;

-- Rename temp tables to original names
ALTER TABLE companies_temp RENAME TO companies;
ALTER TABLE projects_temp RENAME TO projects;
ALTER TABLE people_temp RENAME TO people;
ALTER TABLE collaborations_temp RENAME TO collaborations;

-- Recreate indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX "index_people_company" ON people ("company_id");

-- Verify foreign keys are enabled
PRAGMA foreign_keys;

-- Show final record counts
SELECT 'Companies' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'People', COUNT(*) FROM people
UNION ALL
SELECT 'Collaborations', COUNT(*) FROM collaborations;

-- Show orphaned records that were excluded
SELECT 'Orphaned People' as type, COUNT(*) as count FROM (
  SELECT * FROM people WHERE company_id NOT IN (SELECT id FROM companies)
) UNION ALL
SELECT 'Orphaned Collaborations' as type, COUNT(*) as count FROM (
  SELECT * FROM collaborations
  WHERE company_id NOT IN (SELECT id FROM companies)
     OR project_id NOT IN (SELECT id FROM projects)
     OR person_id NOT IN (SELECT id FROM people)
);