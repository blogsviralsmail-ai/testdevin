import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DB_PATH = path.join(process.cwd(), "voiceai.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables();
  }
  return db;
}

function initTables() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      system_prompt TEXT NOT NULL DEFAULT '',
      greeting_message TEXT DEFAULT 'Hello! How can I help you today?',
      voice TEXT DEFAULT 'alloy',
      language TEXT DEFAULT 'en',
      model TEXT DEFAULT 'gpt-4o-mini',
      max_call_duration INTEGER DEFAULT 300,
      temperature REAL DEFAULT 0.7,
      phone_number_id TEXT,
      status TEXT DEFAULT 'active',
      use_case TEXT DEFAULT 'general',
      total_calls INTEGER DEFAULT 0,
      avg_duration INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS phone_numbers (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      friendly_name TEXT,
      twilio_sid TEXT,
      agent_id TEXT,
      status TEXT DEFAULT 'active',
      country TEXT DEFAULT 'US',
      capabilities TEXT DEFAULT '{"voice":true,"sms":true}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      phone_number_id TEXT,
      twilio_call_sid TEXT,
      direction TEXT NOT NULL DEFAULT 'inbound',
      from_number TEXT,
      to_number TEXT,
      status TEXT DEFAULT 'queued',
      duration INTEGER DEFAULT 0,
      recording_url TEXT,
      transcript TEXT,
      sentiment TEXT,
      summary TEXT,
      cost REAL DEFAULT 0,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      agent_id TEXT,
      phone_numbers TEXT NOT NULL DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      total_calls INTEGER DEFAULT 0,
      completed_calls INTEGER DEFAULT 0,
      successful_calls INTEGER DEFAULT 0,
      failed_calls INTEGER DEFAULT 0,
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_docs (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    );
  `);
}

// Settings helpers
export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')"
  ).run(key, value, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

// Agent helpers
export function createAgent(data: {
  name: string;
  system_prompt: string;
  greeting_message?: string;
  voice?: string;
  language?: string;
  model?: string;
  max_call_duration?: number;
  temperature?: number;
  use_case?: string;
}) {
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO agents (id, name, system_prompt, greeting_message, voice, language, model, max_call_duration, temperature, use_case)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.system_prompt,
    data.greeting_message ?? "Hello! How can I help you today?",
    data.voice ?? "alloy",
    data.language ?? "en",
    data.model ?? "gpt-4o-mini",
    data.max_call_duration ?? 300,
    data.temperature ?? 0.7,
    data.use_case ?? "general"
  );
  return getAgent(id);
}

export function getAgent(id: string) {
  return getDb().prepare("SELECT * FROM agents WHERE id = ?").get(id);
}

export function listAgents() {
  return getDb().prepare("SELECT * FROM agents ORDER BY created_at DESC").all();
}

export function updateAgent(id: string, data: Record<string, unknown>) {
  const allowed = ["name", "system_prompt", "greeting_message", "voice", "language", "model", "max_call_duration", "temperature", "phone_number_id", "status", "use_case"];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (updates.length === 0) return getAgent(id);
  updates.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE agents SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return getAgent(id);
}

export function deleteAgent(id: string) {
  getDb().prepare("DELETE FROM agents WHERE id = ?").run(id);
}

// Phone Number helpers
export function createPhoneNumber(data: {
  number: string;
  friendly_name?: string;
  twilio_sid?: string;
  agent_id?: string;
  country?: string;
}) {
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO phone_numbers (id, number, friendly_name, twilio_sid, agent_id, country)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.number, data.friendly_name ?? data.number, data.twilio_sid ?? "", data.agent_id ?? null, data.country ?? "US");
  return getDb().prepare("SELECT * FROM phone_numbers WHERE id = ?").get(id);
}

export function listPhoneNumbers() {
  return getDb().prepare("SELECT * FROM phone_numbers ORDER BY created_at DESC").all();
}

export function getPhoneNumber(id: string) {
  return getDb().prepare("SELECT * FROM phone_numbers WHERE id = ?").get(id);
}

export function getPhoneNumberByNumber(number: string) {
  return getDb().prepare("SELECT * FROM phone_numbers WHERE number = ?").get(number);
}

export function updatePhoneNumber(id: string, data: Record<string, unknown>) {
  const allowed = ["friendly_name", "agent_id", "status"];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (updates.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE phone_numbers SET ${updates.join(", ")} WHERE id = ?`).run(...values);
}

// Call helpers
export function createCall(data: {
  agent_id?: string;
  phone_number_id?: string;
  twilio_call_sid?: string;
  direction: string;
  from_number?: string;
  to_number?: string;
  status?: string;
}) {
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO calls (id, agent_id, phone_number_id, twilio_call_sid, direction, from_number, to_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.agent_id ?? null, data.phone_number_id ?? null, data.twilio_call_sid ?? "", data.direction, data.from_number ?? "", data.to_number ?? "", data.status ?? "queued");
  return getDb().prepare("SELECT * FROM calls WHERE id = ?").get(id);
}

export function updateCall(id: string, data: Record<string, unknown>) {
  const allowed = ["status", "duration", "recording_url", "transcript", "sentiment", "summary", "cost", "ended_at"];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (updates.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE calls SET ${updates.join(", ")} WHERE id = ?`).run(...values);
}

export function updateCallBySid(sid: string, data: Record<string, unknown>) {
  const call = getDb().prepare("SELECT id FROM calls WHERE twilio_call_sid = ?").get(sid) as { id: string } | undefined;
  if (call) updateCall(call.id, data);
}

export function listCalls(limit = 50) {
  return getDb().prepare("SELECT * FROM calls ORDER BY created_at DESC LIMIT ?").all(limit);
}

export function getCallBySid(sid: string) {
  return getDb().prepare("SELECT * FROM calls WHERE twilio_call_sid = ?").get(sid);
}

// Campaign helpers
export function createCampaign(data: {
  name: string;
  agent_id: string;
  phone_numbers: string[];
  scheduled_at?: string;
}) {
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO campaigns (id, name, agent_id, phone_numbers, total_calls, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.agent_id, JSON.stringify(data.phone_numbers), data.phone_numbers.length, "draft");
  return getDb().prepare("SELECT * FROM campaigns WHERE id = ?").get(id);
}

export function listCampaigns() {
  return getDb().prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all();
}

export function updateCampaign(id: string, data: Record<string, unknown>) {
  const allowed = ["status", "completed_calls", "successful_calls", "failed_calls", "started_at", "completed_at"];
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (updates.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE campaigns SET ${updates.join(", ")} WHERE id = ?`).run(...values);
}

// Knowledge helpers
export function addKnowledgeDoc(data: { agent_id: string; name: string; content: string; type?: string }) {
  const id = uuidv4();
  getDb().prepare("INSERT INTO knowledge_docs (id, agent_id, name, content, type) VALUES (?, ?, ?, ?, ?)").run(
    id, data.agent_id, data.name, data.content, data.type ?? "text"
  );
  return getDb().prepare("SELECT * FROM knowledge_docs WHERE id = ?").get(id);
}

export function listKnowledgeDocs(agentId?: string) {
  if (agentId) {
    return getDb().prepare("SELECT * FROM knowledge_docs WHERE agent_id = ? ORDER BY created_at DESC").all(agentId);
  }
  return getDb().prepare("SELECT * FROM knowledge_docs ORDER BY created_at DESC").all();
}

export function deleteKnowledgeDoc(id: string) {
  getDb().prepare("DELETE FROM knowledge_docs WHERE id = ?").run(id);
}

// Analytics helpers
export function getAnalytics() {
  const d = getDb();
  const totalCalls = (d.prepare("SELECT COUNT(*) as count FROM calls").get() as { count: number }).count;
  const completedCalls = (d.prepare("SELECT COUNT(*) as count FROM calls WHERE status = 'completed'").get() as { count: number }).count;
  const totalDuration = (d.prepare("SELECT COALESCE(SUM(duration), 0) as total FROM calls WHERE status = 'completed'").get() as { total: number }).total;
  const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;
  const totalAgents = (d.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number }).count;

  const recentCalls = d.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM calls 
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  const sentimentCounts = d.prepare(`
    SELECT sentiment, COUNT(*) as count FROM calls 
    WHERE sentiment IS NOT NULL 
    GROUP BY sentiment
  `).all();

  return {
    totalCalls,
    completedCalls,
    totalDuration,
    avgDuration,
    totalAgents,
    recentCalls,
    sentimentCounts,
  };
}

export default getDb;
