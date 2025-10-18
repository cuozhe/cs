"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { getApiBaseUrl } from '@/lib/api';

export default function SettingsPage() {
  const [statusDefs, setStatusDefs] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/settings/status-def`, { signal: controller.signal });
        if (!res.ok) throw new Error(`请求失败: ${res.status}`);
        const data = (await res.json()) as any[];
        setStatusDefs(data);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setError(e.message ?? '加载失败');
      }
    }
    load();
    return () => controller.abort();
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        系统设置
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        状态管理、通知、外观与安全配置入口。
      </Typography>

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        预设状态
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
        {statusDefs.map((s) => (
          <Chip key={s.key} label={`${s.name}（允许调用：${s.allowCall ? '是' : '否'}）`} color={s.color as any} />
        ))}
      </Stack>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
}
