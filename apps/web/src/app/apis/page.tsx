"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

export default function ApisPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        API 管理
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography color="text.secondary">列表、筛选、批量操作将在此处实现。</Typography>
      </Paper>
      <Button variant="contained">新建 API</Button>
    </Box>
  );
}
