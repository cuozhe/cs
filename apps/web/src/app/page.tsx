"use client";

import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function HomePage() {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          欢迎使用 API 管理系统
        </Typography>
        <Typography color="text.secondary">
          从左侧导航开始，进入 API 管理、监控分析、用户与计费、系统设置等模块。
        </Typography>
      </Paper>
    </Box>
  );
}
