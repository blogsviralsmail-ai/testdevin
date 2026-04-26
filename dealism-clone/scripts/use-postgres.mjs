#!/usr/bin/env node
/**
 * Switch the Prisma schema from SQLite to PostgreSQL in-place.
 *
 * Usage:
 *   1. Provision a Postgres DB (e.g. Supabase / Neon / your own VPS).
 *   2. Set DATABASE_URL=postgresql://... in .env
 *   3. node scripts/use-postgres.mjs
 *   4. npx prisma migrate dev --name init_postgres
 *
 * The script is idempotent — running it on an already-Postgres schema
 * is a no-op. To go back to SQLite for dev, swap the lines manually or
 * `git checkout prisma/schema.prisma`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "..", "prisma", "schema.prisma");
const original = readFileSync(schemaPath, "utf8");

if (original.includes('provider = "postgresql"')) {
  console.log("✓ schema.prisma is already on postgresql; nothing to do.");
  process.exit(0);
}
if (!original.includes('provider = "sqlite"')) {
  console.error("✗ Could not find provider line in prisma/schema.prisma");
  process.exit(1);
}

const updated = original.replace('provider = "sqlite"', 'provider = "postgresql"');
writeFileSync(schemaPath, updated);
console.log("✓ Switched prisma/schema.prisma to postgresql.");
console.log("");
console.log("Next steps:");
console.log("  1. Set DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB in .env");
console.log("  2. Run: npx prisma migrate dev --name init_postgres");
console.log("  3. Run: npm run db:seed");
console.log("");
console.log("To migrate existing data from SQLite, see scripts/migrate-sqlite-to-postgres.mjs");
