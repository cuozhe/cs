"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export default function SettingsPage() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        系统设置
      </Typography>
      <Typography color="text.secondary">状态管理、通知、外观与安全配置入口。</Typography>
    </Paper>
  );
}
