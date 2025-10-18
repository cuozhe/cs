"use client";

import * as React from 'react';
import Link from 'next/link';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ApiIcon from '@mui/icons-material/Api';
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const navItems = [
  { label: 'API 管理', icon: <ApiIcon />, href: '/apis' },
  { label: '监控分析', icon: <InsightsIcon />, href: '/monitor' },
  { label: '用户管理', icon: <PeopleIcon />, href: '/users' },
  { label: '计费中心', icon: <MonetizationOnIcon />, href: '/billing' },
  { label: '系统设置', icon: <SettingsIcon />, href: '/settings' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [mode, setMode] = React.useState<'light' | 'dark'>(prefersDark ? 'dark' : 'light');

  React.useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    if (stored === 'light' || stored === 'dark') setMode(stored);
  }, []);

  const theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);

  const toggleTheme = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    if (typeof window !== 'undefined') window.localStorage.setItem('theme', next);
  };

  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
              <Toolbar>
                <DashboardIcon sx={{ mr: 1 }} />
                <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                  API 管理系统
                </Typography>
                <IconButton color="inherit" onClick={toggleTheme} aria-label="切换主题">
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Toolbar>
            </AppBar>
            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
              }}
            >
              <Toolbar />
              <Box sx={{ overflow: 'auto' }}>
                <List>
                  {navItems.map((item) => (
                    <ListItem key={item.label} disablePadding>
                      <ListItemButton component={Link} href={item.href}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                <Divider />
              </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <Toolbar />
              {children}
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
