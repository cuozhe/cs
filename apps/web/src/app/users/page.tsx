"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { getApiBaseUrl } from '@/lib/api';

export default function UsersPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${getApiBaseUrl()}/users`, { signal: controller.signal });
        if (!res.ok) throw new Error(`请求失败: ${res.status}`);
        const data = (await res.json()) as any[];
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

  const columns = React.useMemo<GridColDef<any>[]>(
    () => [
      { field: 'id', headerName: '用户ID', width: 120 },
      { field: 'email', headerName: '邮箱', flex: 1, minWidth: 200 },
      { field: 'nickname', headerName: '昵称', width: 140 },
      { field: 'role', headerName: '角色', width: 120 },
      { field: 'status', headerName: '状态', width: 120 },
    ],
    []
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        用户管理
      </Typography>
      <Paper sx={{ height: 460 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
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
