"use client";

import * as React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export default function BillingPage() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        计费中心
      </Typography>
      <Typography color="text.secondary">价格、套餐、账单与充值功能将逐步完善。</Typography>
    </Paper>
  );
}
