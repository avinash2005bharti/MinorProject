# Legacy Sequelize Migrations and Utility Scripts (ARCH-05)

This folder contains legacy migration scripts and database bootstrapping utilities from the initial Sequelize prototype.
The entire CampusFlow backend has been standardized on **Prisma ORM** (`src/models/postgres/schema.prisma`) as the single source of truth for all PostgreSQL models and migrations.

### Archived Files
- `migrate.js`: Former Sequelize raw SQL runner
- `execute_erd_migration.js`: Former ERD schema migration runner
- `seed_authoritative_baseline.js`: Former Sequelize database seeder
- `run_002_migration.js`: Former SQL runner for 002 schema
- `test_tables.js`: Former Sequelize table introspection
- `create_admin_account.js`: Former Sequelize admin bootstrapping script

### Canonical Replacement
All PostgreSQL migrations are managed through Prisma:
```bash
npx prisma db push
```
All models are defined in `src/models/postgres/schema.prisma` and accessed via `src/config/postgres.js` (`prisma`).
