"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ApiChangeLog, ApiItem, RequestLog, getApiBaseUrl } from '@/lib/api';

function StatusChip({ status }: { status: string }) {
  const color = status.includes('异常') ? 'error' : status.includes('收费') ? 'warning' : 'success';
  return <Chip size="small" color={color as any} label={status} />;
}

export default function ApiDetailPage() {
  const params = useParams();
  const id = String(params?.id);
  const [data, setData] = React.useState<ApiItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState(0);

  const [statusDefs, setStatusDefs] = React.useState<string[]>(['正常', '异常', '收费']);
  const [openStatus, setOpenStatus] = React.useState(false);
  const [targetStatus, setTargetStatus] = React.useState('正常');
  const [remark, setRemark] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const [opLogs, setOpLogs] = React.useState<ApiChangeLog[]>([]);
  const [loadingOpLogs, setLoadingOpLogs] = React.useState(false);
  const [failLogs, setFailLogs] = React.useState<RequestLog[]>([]);
  const [loadingFailLogs, setLoadingFailLogs] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${getApiBaseUrl()}/apis/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`加载失败: ${res.status}`);
        const item = (await res.json()) as ApiItem;
        setData(item);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setError(e.message ?? '加载失败');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
    return () => controller.abort();
  }, [id]);

  React.useEffect(() => {
    async function loadDefs() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/settings/status-def`);
        if (res.ok) {
          const defs = (await res.json()) as any[];
          setStatusDefs(defs.map((d) => d.name));
        }
      } catch {}
    }
    loadDefs();
  }, []);

  const submitStatus = async () => {
    if (!data) return;
    try {
      setSaving(true);
      const res = await fetch(`${getApiBaseUrl()}/apis/${data.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, remark }),
      });
      if (!res.ok) throw new Error(`变更失败: ${res.status}`);
      const updated = (await res.json()) as ApiItem;
      setData(updated);
      setOpenStatus(false);
      setRemark('');
      setTargetStatus(updated.status);
      // reload logs
      loadOpLogs();
    } catch (e: any) {
      setError(e.message ?? '变更失败');
    } finally {
      setSaving(false);
    }
  };

  const loadOpLogs = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoadingOpLogs(true);
      const res = await fetch(`${getApiBaseUrl()}/apis/${id}/logs?limit=200`);
      if (!res.ok) throw new Error(`日志加载失败: ${res.status}`);
      setOpLogs((await res.json()) as ApiChangeLog[]);
    } catch (e: any) {
      setError(e.message ?? '日志加载失败');
    } finally {
      setLoadingOpLogs(false);
    }
  }, [id]);

  const loadFailLogs = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoadingFailLogs(true);
      const res = await fetch(`${getApiBaseUrl()}/logs?apiId=${id}&success=false&limit=200`);
      if (!res.ok) throw new Error(`失败记录加载失败: ${res.status}`);
      setFailLogs((await res.json()) as RequestLog[]);
    } catch (e: any) {
      setError(e.message ?? '失败记录加载失败');
    } finally {
      setLoadingFailLogs(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (tab === 3) loadFailLogs();
    if (tab === 4) loadOpLogs();
  }, [tab, loadFailLogs, loadOpLogs]);

  const opLogCols = React.useMemo<GridColDef<ApiChangeLog>[]>(
    () => [
      { field: 'ts', headerName: '时间', width: 180, valueGetter: (p) => new Date(p.row.ts).toLocaleString() },
      { field: 'action', headerName: '动作', width: 140 },
      { field: 'oldStatus', headerName: '旧状态', width: 120, valueGetter: (p) => p.row.oldStatus ?? '-' },
      { field: 'newStatus', headerName: '新状态', width: 120, valueGetter: (p) => p.row.newStatus ?? '-' },
      { field: 'remark', headerName: '备注', flex: 1, minWidth: 200, valueGetter: (p) => p.row.remark ?? '-' },
    ],
    []
  );

  const failCols = React.useMemo<GridColDef<RequestLog>[]>(
    () => [
      { field: 'ts', headerName: '时间', width: 180, valueGetter: (p) => new Date(p.row.ts).toLocaleString() },
      { field: 'method', headerName: '方法', width: 110 },
      { field: 'apiPath', headerName: '路径', flex: 1, minWidth: 220 },
      { field: 'statusCode', headerName: '状态码', width: 120 },
      { field: 'ip', headerName: '来源 IP', width: 160 },
      { field: 'message', headerName: '错误', flex: 1, minWidth: 200, valueGetter: (p) => p.row.message ?? '-' },
    ],
    []
  );

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            {data?.name ?? (loading ? '加载中…' : '未找到')}
          </Typography>
          {data && <StatusChip status={data.status} />}
          <Box sx={{ flexGrow: 1 }} />
          {data && (
            <>
              <Chip
                variant="outlined"
                size="small"
                label={`${data.method.toUpperCase()} ${data.path}`}
                color={data.method.toUpperCase() === 'GET' ? 'default' : data.method.toUpperCase() === 'POST' ? 'primary' : 'warning'}
              />
              <Button size="small" variant="outlined" onClick={() => { setTargetStatus(data.status); setOpenStatus(true); }}>
                变更状态
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="概览" />
          <Tab label="文档" />
          <Tab label="调用统计" />
          <Tab label="失败记录" />
          <Tab label="操作日志" />
        </Tabs>
        <Divider sx={{ mb: 2 }} />
        {tab === 0 && (
          <Box>
            <Typography color="text.secondary" gutterBottom>
              最近 24 小时调用趋势、成功率等指标将在此展示。
            </Typography>
            <Typography>最近调用时间：{data?.lastCalledAt ?? '-'}</Typography>
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Typography color="text.secondary">接口文档（请求/响应参数、示例）将在此展示。</Typography>
          </Box>
        )}
        {tab === 2 && (
          <Box>
            <Typography color="text.secondary">调用统计图表占位。</Typography>
          </Box>
        )}
        {tab === 3 && (
          <Box sx={{ height: 480 }}>
            <DataGrid
              rows={failLogs}
              columns={failCols}
              getRowId={(r) => r.id}
              loading={loadingFailLogs}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            />
          </Box>
        )}
        {tab === 4 && (
          <Box sx={{ height: 480 }}>
            <DataGrid
              rows={opLogs}
              columns={opLogCols}
              getRowId={(r) => r.id}
              loading={loadingOpLogs}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      <Dialog open={openStatus} onClose={() => setOpenStatus(false)} fullWidth maxWidth="xs">
        <DialogTitle>变更状态</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="目标状态" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
              {statusDefs.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="备注" value={remark} onChange={(e) => setRemark(e.target.value)} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatus(false)}>取消</Button>
          <Button onClick={submitStatus} variant="contained" disabled={saving}>
            {saving ? '提交中…' : '提交'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
