"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { ApiKey, getApiBaseUrl } from '@/lib/api';

export default function SettingsPage() {
  const [statusDefs, setStatusDefs] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', rateLimitPerMin: 60 });

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

  const loadKeys = React.useCallback(async () => {
    try {
      setLoadingKeys(true);
      const res = await fetch(`${getApiBaseUrl()}/keys`);
      if (!res.ok) throw new Error(`加载失败: ${res.status}`);
      const data = (await res.json()) as ApiKey[];
      setKeys(data);
    } catch (e: any) {
      setError(e.message ?? '加载失败');
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  React.useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const createKey = async () => {
    try {
      setCreating(true);
      const res = await fetch(`${getApiBaseUrl()}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`创建失败: ${res.status}`);
      setForm({ name: '', rateLimitPerMin: 60 });
      await loadKeys();
    } catch (e: any) {
      setError(e.message ?? '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const rotateKey = async (id: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/keys/${id}/rotate`, { method: 'POST' });
      if (!res.ok) throw new Error(`重置失败: ${res.status}`);
      await loadKeys();
    } catch (e: any) {
      setError(e.message ?? '重置失败');
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

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

      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        API 调用密钥
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
        <TextField
          label="名称"
          size="small"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <TextField
          label="每分钟限速"
          type="number"
          size="small"
          value={form.rateLimitPerMin}
          onChange={(e) => setForm((f) => ({ ...f, rateLimitPerMin: Number(e.target.value) }))}
          sx={{ width: 160 }}
        />
        <Button variant="contained" onClick={createKey} disabled={creating || !form.name}>
          {creating ? '创建中…' : '新建密钥'}
        </Button>
      </Box>

      <Stack spacing={1} sx={{ mt: 2 }}>
        {loadingKeys ? (
          <Typography color="text.secondary">加载中…</Typography>
        ) : keys.length === 0 ? (
          <Typography color="text.secondary">暂无密钥</Typography>
        ) : (
          keys.map((k) => (
            <Paper key={k.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">{k.name}</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {k.key}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  每分钟限速：{k.rateLimitPerMin}，创建于 {new Date(k.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Button size="small" variant="text" startIcon={<ContentCopyIcon />} onClick={() => copy(k.key)}>
                复制
              </Button>
              <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} onClick={() => rotateKey(k.id)}>
                重置
              </Button>
            </Paper>
          ))
        )}
      </Stack>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
}
