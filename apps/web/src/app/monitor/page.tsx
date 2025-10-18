"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { getApiBaseUrl, Stats } from '@/lib/api';

function StatCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5">
        {value}
        {suffix ?? ''}
      </Typography>
    </Paper>
  );
}

export default function MonitorPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${getApiBaseUrl()}/stats`);
      if (!res.ok) throw new Error(`请求失败: ${res.status}`);
      const data = (await res.json()) as Stats;
      setStats(data);
    } catch (e: any) {
      setError(e.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          监控分析
        </Typography>
        <Button onClick={load} variant="outlined">
          刷新
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography color="text.secondary">加载中...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="总调用" value={stats?.totalCalls ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="成功次数" value={stats?.success ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="失败次数" value={stats?.fail ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="成功率" value={stats?.successRate ?? 0} suffix="%" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography color="text.secondary">趋势图表与阈值告警将逐步接入。</Typography>
      </Paper>
    </Box>
  );
}
