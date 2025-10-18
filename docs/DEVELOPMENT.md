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

### 网关与密钥（已实现基础能力）

- 管理端接口：
  - GET http://localhost:4000/apis 列出 API
  - POST http://localhost:4000/apis 创建 API（字段：name, method, path, status）
  - GET http://localhost:4000/keys 列出调用密钥
  - POST http://localhost:4000/keys 创建密钥（字段：name, rateLimitPerMin）
  - POST http://localhost:4000/keys/:id/rotate 重置密钥值
  - GET http://localhost:4000/logs 最近请求日志
  - GET http://localhost:4000/stats 基本调用统计

- 网关调用：
  - 路由前缀：/gateway/
  - 认证方式：请求头 x-api-key: <密钥值>
  - 根据已注册的 API（method + path，path 支持 :id 这类参数）匹配并返回回显 Mock 响应
  - 示例：

    curl -X GET "http://localhost:4000/gateway/users/123?foo=bar" \
      -H "x-api-key: <从 /keys 获取的 key>"

- 速率限制：
  - 每个密钥独立的每分钟限速（默认 60 次/分钟，可在创建密钥时指定）

- 注意：
  - 目前为内存存储，重启后数据会丢失；后续会接入数据库与持久化。

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
