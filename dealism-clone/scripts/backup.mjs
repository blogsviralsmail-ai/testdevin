#!/usr/bin/env node
/**
 * Daily backup script.
 *
 * Backs up:
 *   - The SQLite DB file (or pg_dump output if Postgres is detected)
 *   - The baileys-auth/ directory (WhatsApp session state — losing this
 *     forces every channel to re-scan QR)
 *
 * Uploads a single .tar.gz to an S3-compatible bucket. Compatible with:
 *   - AWS S3
 *   - Wasabi (s3.<region>.wasabisys.com)
 *   - Backblaze B2 (s3.<region>.backblazeb2.com)
 *   - Cloudflare R2 (<account>.r2.cloudflarestorage.com)
 *   - any custom S3-compatible endpoint
 *
 * Wire this up with cron / systemd timer:
 *   0 3 * * *  cd /opt/dealism-clone && /usr/bin/node scripts/backup.mjs >> /var/log/dealism-backup.log 2>&1
 *
 * Required env (or Setting rows with the same keys):
 *   BACKUP_S3_ENDPOINT     e.g. https://s3.eu-central-1.wasabisys.com
 *   BACKUP_S3_BUCKET       e.g. dealism-backups
 *   BACKUP_S3_ACCESS_KEY
 *   BACKUP_S3_SECRET_KEY
 *   BACKUP_S3_REGION       optional, defaults to "auto"
 *   DATABASE_URL           Prisma connection string
 *   BAILEYS_AUTH_DIR       optional, defaults to ./baileys-auth
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync, mkdtempSync, existsSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/** True when a binary is on PATH (best-effort, never throws). */
function hasBinary(name) {
  try {
    execFileSync("which", [name], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function env(key, fallback = "") {
  return process.env[key] || fallback;
}

const endpoint = env("BACKUP_S3_ENDPOINT");
const bucket = env("BACKUP_S3_BUCKET");
const accessKey = env("BACKUP_S3_ACCESS_KEY");
const secretKey = env("BACKUP_S3_SECRET_KEY");
const region = env("BACKUP_S3_REGION", "auto");

if (!endpoint || !bucket || !accessKey || !secretKey) {
  console.error("Missing required env: BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY");
  process.exit(1);
}

const databaseUrl = env("DATABASE_URL");
if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const stagingDir = mkdtempSync(join(tmpdir(), "dealism-backup-"));
console.log(`[backup] staging in ${stagingDir}`);

// 1. DB snapshot
if (databaseUrl.startsWith("file:")) {
  // SQLite — prefer the official `sqlite3 .backup` API which is
  // WAL-aware and produces a guaranteed consistent snapshot. Falls back
  // to a raw file copy when the sqlite3 CLI isn't installed (still safe
  // for read-mostly DBs but may miss in-flight writes in the WAL).
  const dbPath = databaseUrl.replace(/^file:/, "");
  const resolved = dbPath.startsWith("/") ? dbPath : join(process.cwd(), "prisma", dbPath);
  if (!existsSync(resolved)) {
    console.error(`SQLite DB file not found at ${resolved}`);
    process.exit(1);
  }
  const dest = join(stagingDir, "db.sqlite");
  if (hasBinary("sqlite3")) {
    // execFileSync passes args directly (no shell), so the dot-command
    // is parsed by sqlite3 itself. Don't wrap `dest` in single quotes —
    // they'd be treated as part of the path by sqlite3's parser.
    execFileSync("sqlite3", [resolved, `.backup ${dest}`], { stdio: "inherit" });
    console.log(`[backup] sqlite3 .backup -> ${dest} (${statSync(dest).size} bytes)`);
  } else {
    copyFileSync(resolved, dest);
    console.warn(
      `[backup] sqlite3 CLI not found; using copyFileSync fallback (may miss WAL). Install sqlite3 for safer backups.`,
    );
    console.log(`[backup] copied SQLite DB (${statSync(resolved).size} bytes)`);
  }
} else if (databaseUrl.startsWith("postgres")) {
  // Postgres — use pg_dump if available. Pass the connection string via
  // argv (NOT a shell-interpolated string) so passwords containing $, `,
  // \, or " can never be interpreted as shell metacharacters.
  try {
    execFileSync(
      "pg_dump",
      [
        "--no-owner",
        "--format=custom",
        `--file=${join(stagingDir, "db.dump")}`,
        databaseUrl,
      ],
      { stdio: "inherit" },
    );
    console.log("[backup] pg_dump complete");
  } catch (err) {
    console.error("pg_dump failed — install postgresql-client (pg_dump) on this machine.");
    process.exit(1);
  }
} else {
  console.error(`Unsupported DATABASE_URL scheme: ${databaseUrl.slice(0, 12)}…`);
  process.exit(1);
}

// 2. Baileys auth state
const baileysDir = env("BAILEYS_AUTH_DIR", join(process.cwd(), "baileys-auth"));
if (existsSync(baileysDir)) {
  execFileSync("tar", [
    "-czf",
    join(stagingDir, "baileys-auth.tar.gz"),
    "-C",
    join(baileysDir, ".."),
    basename(baileysDir),
  ]);
  console.log("[backup] tarred baileys-auth/");
} else {
  console.log("[backup] no baileys-auth/ directory; skipping");
}

// 3. Bundle into a single archive
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const archiveName = `dealism-backup-${stamp}.tar.gz`;
const archivePath = join(tmpdir(), archiveName);
execFileSync("tar", ["-czf", archivePath, "-C", stagingDir, "."]);
const archiveBytes = readFileSync(archivePath);
console.log(`[backup] archive size: ${archiveBytes.length} bytes`);

// 4. Upload
const s3 = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true, // most S3-compatible providers need this
});
await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: `daily/${archiveName}`,
    Body: archiveBytes,
    ContentType: "application/gzip",
  }),
);
console.log(`[backup] uploaded s3://${bucket}/daily/${archiveName}`);

// 5. Clean up. We let failures here log but not fail the run — the
// upload already succeeded. Without this the /tmp staging dir + archive
// would leak across every cron tick.
try {
  rmSync(stagingDir, { recursive: true, force: true });
  rmSync(archivePath, { force: true });
  console.log(`[backup] cleaned staging dir + archive`);
} catch (err) {
  console.warn(`[backup] cleanup warning: ${err instanceof Error ? err.message : err}`);
}
