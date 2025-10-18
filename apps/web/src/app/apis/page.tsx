"use client";

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ApiItem, getApiBaseUrl } from '@/lib/api';

export default function ApisPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = React.useState<ApiItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', method: 'GET', path: '', status: '正常' });
  const [creating, setCreating] = React.useState(false);

  // Sync query from URL
  React.useEffect(() => {
    const q = searchParams?.get('query') || '';
    setQuery(q);
  }, [searchParams]);

  const filtered = React.useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q));
  }, [rows, query]);

  React.useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${getApiBaseUrl()}/apis`, { signal: controller.signal });
        if (!res.ok) throw new Error(`请求失败: ${res.status}`);
        const data = (await res.json()) as ApiItem[];
        setRows(data);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setError(e.message ?? '加载失败');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const columns = React.useMemo<GridColDef<ApiItem>[]>(
    () => [
      { field: 'id', headerName: '接口ID', width: 140 },
      { field: 'name', headerName: '名称', flex: 1, minWidth: 160 },
      {
        field: 'method',
        headerName: '方法',
        width: 110,
        renderCell: (params) => {
          const m = String(params.value).toUpperCase();
          const color = m === 'GET' ? 'default' : m === 'POST' ? 'primary' : m === 'PUT' ? 'warning' : 'error';
          return <Chip size="small" color={color as any} label={m} />;
        },
      },
      { field: 'path', headerName: '请求地址', flex: 1, minWidth: 220 },
      {
        field: 'status',
        headerName: '状态',
        width: 120,
        renderCell: (params) => {
          const s = String(params.value);
          const color = s.includes('异常') ? 'error' : s.includes('收费') ? 'warning' : 'success';
          return <Chip size="small" color={color as any} label={s} />;
        },
      },
      { field: 'lastCalledAt', headerName: '最近调用时间', width: 180, valueFormatter: (p) => p.value ?? '-' },
      {
        field: 'actions',
        headerName: '操作',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button component={Link} href={`/apis/${params.row.id}`} size="small">
            查看
          </Button>
        ),
      },
    ],
    []
  );

  const submitCreate = async () => {
    try {
      setCreating(true);
      const res = await fetch(`${getApiBaseUrl()}/apis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`创建失败: ${res.status}`);
      const item = (await res.json()) as ApiItem;
      setRows((prev) => [item, ...prev]);
      setCreateOpen(false);
      setForm({ name: '', method: 'GET', path: '', status: '正常' });
    } catch (e: any) {
      setError(e.message ?? '创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        API 管理
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            size="small"
            label="搜索名称/地址"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ maxWidth: 360 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined">导入 OpenAPI 文档</Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            新建 API
          </Button>
        </Stack>
      </Paper>
      <Paper sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          slotProps={{
            loadingOverlay: { variant: 'linear-progress' },
            noRowsOverlay: { variant: 'skeleton' },
          } as any}
        />
      </Paper>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>新建 API</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="名称"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <TextField
              label="请求方式"
              select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              required
            >
              {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="请求地址（Path）"
              value={form.path}
              onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
              required
            />
            <TextField
              label="状态"
              select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {['正常', '异常', '收费'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>取消</Button>
          <Button onClick={submitCreate} variant="contained" disabled={creating || !form.name || !form.path}>
            {creating ? '创建中...' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
