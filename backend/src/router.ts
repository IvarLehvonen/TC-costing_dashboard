import type { IncomingMessage, ServerResponse } from 'node:http';
import { getConfig, upsertConfig } from './config/database.js';
import { encrypt } from './config/crypto.js';

const startTime = Date.now();

// ── Small helpers ──────────────────────────────────────────

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

// ── Route handlers ─────────────────────────────────────────

function handleHealth(_req: IncomingMessage, res: ServerResponse): void {
  json(res, 200, {
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}

function handleGetConfig(_req: IncomingMessage, res: ServerResponse): void {
  const row = getConfig();
  if (!row) {
    json(res, 404, { error: 'No config set. POST /api/config first.' });
    return;
  }
  // Password is never returned.
  json(res, 200, {
    url: row.url,
    username: row.username,
    updatedAt: row.updated_at,
  });
}

async function handlePostConfig(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    json(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const { url, username, password } = body as {
    url?: unknown;
    username?: unknown;
    password?: unknown;
  };

  if (
    typeof url !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    json(res, 400, {
      error: 'Body must contain string fields: url, username, password',
    });
    return;
  }

  try {
    const passwordEnc = encrypt(password);
    upsertConfig(url, username, passwordEnc);
    json(res, 200, { ok: true, url, username });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    json(res, 500, { error: msg });
  }
}

// ── Dispatch ───────────────────────────────────────────────

export async function route(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method ?? 'GET';
  const path = (req.url ?? '/').split('?')[0]; // strip query string

  if (method === 'GET' && path === '/health') {
    handleHealth(req, res);
    return;
  }
  if (method === 'GET' && path === '/api/config') {
    handleGetConfig(req, res);
    return;
  }
  if (method === 'POST' && path === '/api/config') {
    await handlePostConfig(req, res);
    return;
  }

  json(res, 404, { error: 'Not found' });
}