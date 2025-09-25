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

- Node.js 22.19.0+ (or latest LTS)
- pnpm (or npm/yarn)

### Running app

- Install and run:
  pnpm install
  pnpm run dev
- The app runs on port 3000 by default: http://localhost:3000

## Database

This project uses a local SQLite database. For local development, create a folder named `db` at the repository root and add a SQLite database file named `db.sqlite3`.

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

### Pull request checklist

- [ ] Code builds and tests pass locally.
- [ ] Linting/formatting applied.
- [ ] No sensitive data (passwords, secrets) included.

### Non-code contributions

- Other improvements such as translations, UI & UX suggestions, icons and designs are welcome. Open issues or PRs just like for code.
- Propose larger ideas in an issue first so maintainers can provide feedback before an implementation.

### Review process

- Maintainers will review PRs, request changes if necessary, and merge when ready.
- Code Rabbit (an automated code-review tool) runs on pull requests and posts suggestions. Please review and address its recommendations before requesting a final review; if you disagree with a suggestion, explain why in the PR comments. Maintainers may require resolving important warnings before merging.
- Please be responsive to review comments - small follow-ups are common.

### Communication & conduct

- Be respectful and constructive. This project follows the license in the repository; if a Code of Conduct is added later, contributors must follow it.

Thank you for helping improve Company Database - every contribution helps!
