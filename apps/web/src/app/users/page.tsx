"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export default function UsersPage() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        用户管理
      </Typography>
      <Typography color="text.secondary">用户、角色与密钥管理将在此实现。</Typography>
    </Paper>
  );
}
