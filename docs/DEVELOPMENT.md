# 开发指南

本项目包含一个前端（Next.js + MUI）与一个后端（Express + TypeScript），采用 npm workspaces 管理。

目录结构：

- apps/web: 前端管理后台（Next.js 14 + React + MUI）
- apps/server: 后端 API 服务（Express + TypeScript）
- docs: 产品与交互设计文档

## 快速开始

1. 安装 Node.js（建议 Node 18+）：
2. 在项目根目录安装依赖：

   npm install

3. 启动后端（默认 4000 端口）：

   npm run dev:server

4. 另开一个终端，启动前端（默认 3000 端口）：

   npm run dev:web

5. 打开浏览器访问：http://localhost:3000

后端健康检查接口：http://localhost:4000/healthz

## 构建与启动

- 构建后端：

  npm run build:server

- 构建前端：

  npm run build:web

- 生产模式启动：

  npm run start:server
  npm run start:web

## 下一步规划

- 接入 API 列表（apps/web）从后端 /apis 读取数据并展示 DataGrid
- 完成基础路由与面包屑、全局搜索与主题切换持久化
- 定义后端接口契约与 DTO（参考 docs/api-management-system-design-zh.md）
- 接入用户鉴权与 RBAC（JWT）
- 监控与统计数据的模型与聚合接口
