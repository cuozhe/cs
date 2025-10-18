import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/apis', (_req: Request, res: Response) => {
  // Placeholder list of APIs; this will be backed by a real DB later.
  res.json([
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
  ]);
});

app.get('/stats', (_req: Request, res: Response) => {
  res.json({ totalCalls: 0, success: 0, fail: 0, successRate: 0 });
});

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening at http://localhost:${PORT}`);
});
