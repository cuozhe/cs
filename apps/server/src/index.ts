import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { match } from 'path-to-regexp';
import { randomBytes } from 'crypto';

// Types
export type ApiItem = {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  path: string;
  status: string;
  lastCalledAt: string | null;
};

export type StatusDef = {
  key: string;
  name: string;
  color: string;
  allowCall: boolean;
  priority?: number;
};

export type Stats = {
  totalCalls: number;
  success: number;
  fail: number;
  successRate: number; // 0-100
};

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  rateLimitPerMin: number;
  createdAt: string;
};

export type RequestLog = {
  id: string;
  ts: string;
  apiId: string | null;
  apiName: string | null;
  apiPath: string | null;
  method: string;
  statusCode: number;
  success: boolean;
  ip: string;
  apiKeyId: string | null;
  message?: string;
};

export type ApiChangeLog = {
  id: string;
  ts: string;
  apiId: string;
  actor: string; // placeholder actor id or name
  action: 'status_change' | 'create' | 'update' | 'delete';
  oldStatus?: string | null;
  newStatus?: string | null;
  remark?: string;
};

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// In-memory data store (to be replaced by a real DB later)
let nextApiId = 3;
const genApiId = () => `api_${nextApiId++}`;
let nextKeyId = 1;
const genKeyId = () => `key_${nextKeyId++}`;

let apis: ApiItem[] = [
  {
    id: 'api_1',
    name: '用户信息查询',
    method: 'GET',
    path: '/users/:id',
    status: '正常',
    lastCalledAt: null,
  },
  {
    id: 'api_2',
    name: '订单创建',
    method: 'POST',
    path: '/orders',
    status: '收费',
    lastCalledAt: null,
  },
];

const statusDefs: StatusDef[] = [
  { key: 'normal', name: '正常', color: 'success', allowCall: true, priority: 1 },
  { key: 'error', name: '异常', color: 'error', allowCall: true, priority: 2 },
  { key: 'paid', name: '收费', color: 'warning', allowCall: true, priority: 3 },
];

let stats: Stats = { totalCalls: 0, success: 0, fail: 0, successRate: 0 };

const apiKeys: ApiKey[] = [
  {
    id: genKeyId(),
    name: '默认测试密钥',
    key: randomBytes(24).toString('hex'),
    enabled: true,
    rateLimitPerMin: 60,
    createdAt: new Date().toISOString(),
  },
];

const rateBuckets = new Map<string, { windowStart: number; count: number }>();
const logs: RequestLog[] = [];
const apiChangeLogs: ApiChangeLog[] = [];

// Helpers
function computeSuccessRate(s: { success: number; fail: number; totalCalls?: number }): number {
  const total = s.totalCalls ?? s.success + s.fail;
  if (total <= 0) return 0;
  return Math.round((s.success / total) * 100);
}

function getClientIp(req: Request): string {
  const fwd = (req.headers['x-forwarded-for'] as string) || '';
  return (fwd.split(',')[0] || req.socket.remoteAddress || '').toString();
}

function findApiByMethodAndPath(method: string, reqPath: string): { api: ApiItem; params: Record<string, string> } | null {
  const m = method.toUpperCase();
  for (const a of apis) {
    if (a.method.toUpperCase() !== m) continue;
    const matcher = match<Record<string, string>>(a.path, { decode: decodeURIComponent });
    const res = matcher(reqPath);
    if (res) return { api: a, params: res.params };
  }
  return null;
}

function logRequest(partial: Omit<RequestLog, 'id' | 'ts'>) {
  const item: RequestLog = {
    id: `log_${logs.length + 1}`,
    ts: new Date().toISOString(),
    ...partial,
  };
  logs.unshift(item);
  if (logs.length > 2000) logs.pop();
}

function logApiChange(change: Omit<ApiChangeLog, 'id' | 'ts'>) {
  const item: ApiChangeLog = {
    id: `op_${apiChangeLogs.length + 1}`,
    ts: new Date().toISOString(),
    ...change,
  };
  apiChangeLogs.unshift(item);
  if (apiChangeLogs.length > 2000) apiChangeLogs.pop();
}

// Routes
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// List APIs with optional fuzzy query (?query= or ?q=)
app.get('/apis', (req: Request, res: Response) => {
  const q = String((req.query.query ?? req.query.q ?? '').toString()).trim().toLowerCase();
  const result = q
    ? apis.filter((a) => a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q))
    : apis;
  res.json(result);
});

// Get one API by id
app.get('/apis/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = apis.find((a) => a.id === id);
  if (!item) return res.status(404).json({ error: 'API not found' });
  res.json(item);
});

// Create a new API
app.post('/apis', (req: Request, res: Response) => {
  const { name, method, path, status } = req.body ?? {};
  if (!name || !method || !path) {
    return res.status(400).json({ error: 'Missing required field(s): name, method, path' });
  }
  const item: ApiItem = {
    id: genApiId(),
    name: String(name),
    method: String(method).toUpperCase(),
    path: String(path),
    status: status ? String(status) : '正常',
    lastCalledAt: null,
  };
  apis.unshift(item);
  logApiChange({ apiId: item.id, actor: 'system', action: 'create', newStatus: item.status });
  res.status(201).json(item);
});

// Update an API
app.put('/apis/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = apis.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'API not found' });
  const { name, method, path, status, lastCalledAt } = req.body ?? {};
  const current = apis[idx];
  const updated: ApiItem = {
    ...current,
    ...(name !== undefined ? { name: String(name) } : {}),
    ...(method !== undefined ? { method: String(method).toUpperCase() } : {}),
    ...(path !== undefined ? { path: String(path) } : {}),
    ...(status !== undefined ? { status: String(status) } : {}),
    ...(lastCalledAt !== undefined ? { lastCalledAt: lastCalledAt ? String(lastCalledAt) : null } : {}),
  };
  apis[idx] = updated;
  logApiChange({ apiId: updated.id, actor: 'system', action: 'update' });
  res.json(updated);
});

// Change API status with remark
app.post('/apis/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = apis.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'API not found' });
  const { status, remark } = req.body ?? {};
  if (!status) return res.status(400).json({ error: 'Missing required field: status' });
  const allowed = new Set(statusDefs.map((s) => s.name));
  if (!allowed.has(String(status))) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }
  const old = apis[idx].status;
  apis[idx].status = String(status);
  logApiChange({ apiId: apis[idx].id, actor: 'system', action: 'status_change', oldStatus: old, newStatus: apis[idx].status, remark });
  res.json(apis[idx]);
});

// Delete API
app.delete('/apis/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = apis.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'API not found' });
  const removed = apis.splice(idx, 1)[0];
  logApiChange({ apiId: removed.id, actor: 'system', action: 'delete', oldStatus: removed.status });
  res.json({ ok: true });
});

// Import OpenAPI/Swagger basic
app.post('/apis/import-openapi', (req: Request, res: Response) => {
  let spec: any = (req.body as any)?.spec ?? (req.body as any)?.openapi ?? null;
  if (!spec && typeof (req.body as any)?.text === 'string') {
    try {
      spec = JSON.parse((req.body as any).text);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON text' });
    }
  }
  if (!spec || typeof spec !== 'object') {
    return res.status(400).json({ error: 'Missing spec' });
  }
  const paths = spec.paths || {};
  const created: ApiItem[] = [];
  const skipped: { method: string; path: string }[] = [];
  const methods = ['get', 'post', 'put', 'delete'];
  for (const rawPath of Object.keys(paths)) {
    for (const m of methods) {
      const def = paths[rawPath]?.[m];
      if (!def) continue;
      const method = m.toUpperCase();
      const path = String(rawPath).replace(/\{([^}]+)\}/g, ':$1');
      // avoid duplicate
      const exists = apis.some((a) => a.method.toUpperCase() === method && a.path === path);
      if (exists) {
        skipped.push({ method, path });
        continue;
      }
      const name = def.summary || `${method} ${rawPath}`;
      const item: ApiItem = {
        id: genApiId(),
        name: String(name),
        method,
        path,
        status: '正常',
        lastCalledAt: null,
      };
      apis.unshift(item);
      logApiChange({ apiId: item.id, actor: 'system', action: 'create', newStatus: item.status, remark: 'import-openapi' });
      created.push(item);
    }
  }
  res.json({ created, skipped });
});

// API Keys
app.get('/keys', (_req: Request, res: Response) => {
  res.json(apiKeys.map((k) => ({ ...k, key: k.key })));
});

app.post('/keys', (req: Request, res: Response) => {
  const { name, rateLimitPerMin } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'Missing required field: name' });
  const item: ApiKey = {
    id: genKeyId(),
    name: String(name),
    key: randomBytes(24).toString('hex'),
    enabled: true,
    rateLimitPerMin: rateLimitPerMin ? Number(rateLimitPerMin) : 60,
    createdAt: new Date().toISOString(),
  };
  apiKeys.push(item);
  res.status(201).json(item);
});

app.post('/keys/:id/rotate', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = apiKeys.findIndex((k) => k.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Key not found' });
  apiKeys[idx] = { ...apiKeys[idx], key: randomBytes(24).toString('hex') };
  res.json(apiKeys[idx]);
});

// Basic stats
app.get('/stats', (_req: Request, res: Response) => {
  stats.successRate = computeSuccessRate(stats);
  res.json(stats);
});

// Logs with filters
app.get('/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Math.max(1, Math.min(1000, Number(req.query.limit))) : 100;
  let result = logs;
  if (typeof req.query.apiId === 'string') {
    result = result.filter((l) => l.apiId === req.query.apiId);
  }
  if (typeof req.query.success === 'string') {
    const s = req.query.success.toLowerCase();
    if (s === 'true' || s === 'false') {
      result = result.filter((l) => l.success === (s === 'true'));
    }
  }
  if (typeof req.query.code === 'string') {
    const code = Number(req.query.code);
    if (!Number.isNaN(code)) result = result.filter((l) => l.statusCode === code);
  }
  res.json(result.slice(0, limit));
});

// API change logs
app.get('/apis/:id/logs', (req: Request, res: Response) => {
  const { id } = req.params;
  const limit = req.query.limit ? Math.max(1, Math.min(1000, Number(req.query.limit))) : 100;
  const items = apiChangeLogs.filter((l) => l.apiId === id).slice(0, limit);
  res.json(items);
});

// Users (placeholder)
app.get('/users', (_req: Request, res: Response) => {
  res.json([
    { id: 'u_1', email: 'alice@example.com', nickname: 'Alice', role: 'admin', status: 'active' },
    { id: 'u_2', email: 'bob@example.com', nickname: 'Bob', role: 'user', status: 'active' },
    { id: 'u_3', email: 'carol@example.com', nickname: 'Carol', role: 'user', status: 'disabled' },
  ]);
});

// Settings: status definitions
app.get('/settings/status-def', (_req: Request, res: Response) => {
  res.json(statusDefs);
});

// Gateway route: authentication, rate limiting, matching and mock response
app.all('/gateway/*', (req: Request, res: Response) => {
  const keyHeader = (req.headers['x-api-key'] as string) || '';
  const cliIp = getClientIp(req);
  const apiKey = apiKeys.find((k) => k.key === keyHeader && k.enabled);
  if (!apiKey) {
    stats.totalCalls += 1;
    stats.fail += 1;
    logRequest({
      apiId: null,
      apiName: null,
      apiPath: null,
      method: req.method.toUpperCase(),
      statusCode: 401,
      success: false,
      ip: cliIp,
      apiKeyId: null,
      message: 'Unauthorized: invalid or missing x-api-key',
    });
    return res.status(401).json({ error: 'Unauthorized: invalid or missing x-api-key' });
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % 60);
  const bucket = rateBuckets.get(apiKey.id) || { windowStart, count: 0 };
  if (bucket.windowStart !== windowStart) {
    bucket.windowStart = windowStart;
    bucket.count = 0;
  }
  if (bucket.count >= apiKey.rateLimitPerMin) {
    stats.totalCalls += 1;
    stats.fail += 1;
    rateBuckets.set(apiKey.id, bucket);
    logRequest({
      apiId: null,
      apiName: null,
      apiPath: null,
      method: req.method.toUpperCase(),
      statusCode: 429,
      success: false,
      ip: cliIp,
      apiKeyId: apiKey.id,
      message: 'Too Many Requests',
    });
    return res.status(429).json({ error: 'Too Many Requests' });
  }
  bucket.count += 1;
  rateBuckets.set(apiKey.id, bucket);

  const subPath = '/' + String((req.params as any)[0] || '').replace(/^\//, '');
  const method = req.method.toUpperCase();
  const found = findApiByMethodAndPath(method, subPath);
  if (!found) {
    stats.totalCalls += 1;
    stats.fail += 1;
    logRequest({
      apiId: null,
      apiName: null,
      apiPath: subPath,
      method,
      statusCode: 404,
      success: false,
      ip: cliIp,
      apiKeyId: apiKey.id,
      message: 'API not found',
    });
    return res.status(404).json({ error: 'API not found' });
  }

  const { api } = found;
  // Simple status control: when status includes '异常' or '禁用' we block
  if (api.status.includes('异常') || api.status.includes('禁用')) {
    stats.totalCalls += 1;
    stats.fail += 1;
    logRequest({
      apiId: api.id,
      apiName: api.name,
      apiPath: api.path,
      method,
      statusCode: 503,
      success: false,
      ip: cliIp,
      apiKeyId: apiKey.id,
      message: 'API disabled by status',
    });
    return res.status(503).json({ error: 'API is disabled by status' });
  }

  api.lastCalledAt = new Date().toISOString();
  stats.totalCalls += 1;
  stats.success += 1;
  logRequest({
    apiId: api.id,
    apiName: api.name,
    apiPath: api.path,
    method,
    statusCode: 200,
    success: true,
    ip: cliIp,
    apiKeyId: apiKey.id,
  });

  // Mock response (echo request)
  res.json({
    ok: true,
    api: { id: api.id, name: api.name, method: api.method, path: api.path },
    received: {
      method,
      path: subPath,
      query: req.query,
      headers: Object.fromEntries(Object.entries(req.headers).filter(([k]) => !k.startsWith('x-'))),
      body: req.body ?? null,
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening at http://localhost:${PORT}`);
});
