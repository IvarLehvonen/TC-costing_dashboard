import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

// Where SQLite files live. /data is mounted from the tc_data Docker volume.
// Fall back to a local ./data folder when running outside Docker (e.g. `npm run dev`).
const DATA_DIR = process.env.DATA_DIR ?? '/data';
mkdirSync(DATA_DIR, { recursive: true });

const configDb = new DatabaseSync(`${DATA_DIR}/config.db`);
const bomDb = new DatabaseSync(`${DATA_DIR}/bom_data.db`);

// ── Schema creation ────────────────────────────────────────
// Idempotent: CREATE TABLE IF NOT EXISTS runs every startup, no-op if already there.

configDb.exec(`
  CREATE TABLE IF NOT EXISTS tc_config (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    url           TEXT NOT NULL,
    username      TEXT NOT NULL,
    password_enc  TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at    TEXT NOT NULL,
    finished_at   TEXT,
    status        TEXT NOT NULL,
    rows_written  INTEGER,
    error_msg     TEXT,
    export_path   TEXT
  );
`);

bomDb.exec(`
  CREATE TABLE IF NOT EXISTS bom_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id         INTEGER NOT NULL,
    item_id         TEXT NOT NULL,
    item_revision   TEXT NOT NULL,
    find_number     TEXT,
    name            TEXT NOT NULL,
    description     TEXT,
    quantity        REAL NOT NULL,
    unit_cost       REAL,
    extended_cost   REAL,
    currency        TEXT,
    level           INTEGER NOT NULL,
    parent_item_id  TEXT,
    fetched_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bom_summary (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id              INTEGER NOT NULL,
    total_items          INTEGER NOT NULL,
    total_extended_cost  REAL,
    currency             TEXT,
    items_missing_cost   INTEGER NOT NULL,
    max_level            INTEGER NOT NULL,
    computed_at          TEXT NOT NULL
  );
`);

// ── Typed query helpers ────────────────────────────────────

interface TcConfigRow {
  url: string;
  username: string;
  password_enc: string;
  updated_at: string;
}

export function getConfig(): TcConfigRow | null {
  const stmt = configDb.prepare(
    'SELECT url, username, password_enc, updated_at FROM tc_config WHERE id = 1'
  );
  const row = stmt.get() as TcConfigRow | undefined;
  return row ?? null;
}

export function upsertConfig(
  url: string,
  username: string,
  passwordEnc: string
): void {
  const updatedAt = new Date().toISOString();
  const stmt = configDb.prepare(`
    INSERT INTO tc_config (id, url, username, password_enc, updated_at)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      url          = excluded.url,
      username     = excluded.username,
      password_enc = excluded.password_enc,
      updated_at   = excluded.updated_at
  `);
  stmt.run(url, username, passwordEnc, updatedAt);
}

// Expose the raw DB handles for the BOM service later.
export { configDb, bomDb };