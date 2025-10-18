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
import { ApiItem, getApiBaseUrl } from '@/lib/api';

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
            <Chip
              variant="outlined"
              size="small"
              label={`${data.method.toUpperCase()} ${data.path}`}
              color={data.method.toUpperCase() === 'GET' ? 'default' : data.method.toUpperCase() === 'POST' ? 'primary' : 'warning'}
            />
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
          <Box>
            <Typography color="text.secondary">失败记录列表占位。</Typography>
          </Box>
        )}
        {tab === 4 && (
          <Box>
            <Typography color="text.secondary">操作日志占位。</Typography>
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
