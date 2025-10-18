import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';

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

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// In-memory data store (to be replaced by a real DB later)
let nextApiId = 3;
const genApiId = () => `api_${nextApiId++}`;

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

// Helpers
function computeSuccessRate(s: { success: number; fail: number; totalCalls?: number }): number {
  const total = s.totalCalls ?? s.success + s.fail;
  if (total <= 0) return 0;
  return Math.round((s.success / total) * 100);
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
  apis.push(item);
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
  res.json(updated);
});

// Basic stats
app.get('/stats', (_req: Request, res: Response) => {
  stats.successRate = computeSuccessRate(stats);
  res.json(stats);
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

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening at http://localhost:${PORT}`);
});
