#!/usr/bin/env node
/**
 * Copy data from a SQLite Prisma DB into a Postgres Prisma DB.
 *
 * Usage:
 *   SQLITE_URL=file:./dev.db \
 *   POSTGRES_URL=postgresql://USER:PASS@HOST:5432/DB \
 *   node scripts/migrate-sqlite-to-postgres.mjs
 *
 * Both DBs must have an identical, already-migrated schema. Postgres
 * tables can be empty or have prior data; this script *upserts* by id.
 */
import { PrismaClient as SqlitePrisma } from "@prisma/client";
import { execSync } from "node:child_process";

const SQLITE_URL = process.env.SQLITE_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
if (!SQLITE_URL || !POSTGRES_URL) {
  console.error("Set SQLITE_URL and POSTGRES_URL env vars before running.");
  process.exit(1);
}

// Prisma reads DATABASE_URL at construction time, so we shell out for the
// second client by spawning a fresh process via the runtime env override.
const sqlite = new SqlitePrisma({ datasources: { db: { url: SQLITE_URL } } });
const postgres = new SqlitePrisma({ datasources: { db: { url: POSTGRES_URL } } });

async function migrate() {
  // Order matters: parents before children (FK).
  const users = await sqlite.user.findMany();
  const plans = await sqlite.plan.findMany();
  const settings = await sqlite.setting.findMany();
  const agents = await sqlite.agent.findMany();
  const channels = await sqlite.channel.findMany();
  const conversations = await sqlite.conversation.findMany();
  const messages = await sqlite.message.findMany();
  const knowledge = await sqlite.knowledgeItem.findMany();

  console.log(
    `Source rows — users:${users.length} plans:${plans.length} settings:${settings.length} ` +
      `agents:${agents.length} channels:${channels.length} convos:${conversations.length} ` +
      `msgs:${messages.length} kb:${knowledge.length}`,
  );

  for (const u of users) await postgres.user.upsert({ where: { id: u.id }, create: u, update: u });
  for (const p of plans) await postgres.plan.upsert({ where: { id: p.id }, create: p, update: p });
  for (const s of settings) await postgres.setting.upsert({ where: { id: s.id }, create: s, update: s });
  for (const a of agents) await postgres.agent.upsert({ where: { id: a.id }, create: a, update: a });
  for (const c of channels) await postgres.channel.upsert({ where: { id: c.id }, create: c, update: c });
  for (const c of conversations) await postgres.conversation.upsert({ where: { id: c.id }, create: c, update: c });
  for (const m of messages) await postgres.message.upsert({ where: { id: m.id }, create: m, update: m });
  for (const k of knowledge) await postgres.knowledgeItem.upsert({ where: { id: k.id }, create: k, update: k });

  console.log("✓ Migration complete.");
  await sqlite.$disconnect();
  await postgres.$disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});

// silence unused-import lint for execSync — kept for potential future ALTER work
void execSync;
