"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ApiItem, getApiBaseUrl } from '@/lib/api';

export default function ApisPage() {
  const [rows, setRows] = React.useState<ApiItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

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
    ],
    []
  );

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
          <Button variant="contained">新建 API</Button>
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
    </Box>
  );
}
