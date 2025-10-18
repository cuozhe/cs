"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export default function MonitorPage() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        监控分析
      </Typography>
      <Typography color="text.secondary">趋势图表与阈值告警将逐步接入。</Typography>
    </Paper>
  );
}
