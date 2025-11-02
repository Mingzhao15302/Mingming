# HuiCloud OS v25.11.2

HuiCloud OS 是一个浏览器运行的多功能业务中台示例项目，包含 Node.js + Express 后端与 React 18 + Vite + TypeScript 前端。项目满足题述的结构规划、模块划分与主要技术栈要求，侧重于演示应用框架、模块边界与数据流动方式。

## 目录结构

```
HuiCloudOS v25.11.2/
├─ server/
│  ├─ index.ts
│  ├─ routes/
│  ├─ services/
│  ├─ db/
│  └─ middleware/
├─ web/
│  ├─ index.html
│  ├─ public/
│  └─ src/
└─ exports/
```

各目录职责与题目要求一致，详情参阅源代码注释。

## 快速开始

```bash
npm install
npm start
```

`npm start` 会并行启动：

- `tsx` 运行的 Express API（默认端口 `http://localhost:5050`）
- Vite React 开发服务器（默认端口 `http://localhost:5173`）

Vite 会在终端显示本地与局域网地址。

> 首次运行会自动在 `HuiCloudOS v25.11.2/server/db` 目录下生成 SQLite 数据库。

## 生产构建

```bash
npm run build
```

前端构建产物位于 `HuiCloudOS v25.11.2/web/dist`。

## 许可证

MIT
