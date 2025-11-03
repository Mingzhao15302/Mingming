# HuiCloud OS

HuiCloud OS（辉云易达 OS）是一个基于 Node.js + Express 与 Vite + React 的业务中台示例，提供视频库管理、商城、报价、订单、合同、导出、设置、维护等模块。前端采用液态玻璃风格 UI，并针对 PC / 平板 / 手机自适配。

## 特性

- **视频库**：分片上传（≤100MB）、首帧画布截取、服务端分页 + 前端懒加载、分类编辑、CSV 导入导出。
- **视频浏览**：IntersectionObserver 懒加载、预加载首帧、悬浮控制条、全屏/下载。
- **CSV 支持**：前端 Web Worker 解析、后端原生 CSV parse/stringify，UTF-8 with BOM 导出。
- **商城**：商品分页、响应式卡片、购物车/结算/下单成功流程。
- **控制台**：多标签页单页后台（视频库 / 报价 / 订单 / 商品 / 合同 / 导出 / 设置 / 维护）。
- **系统维护**：日志查看、备份导出、本地持久化。
- **静态资源**：Vite 构建，Express 提供静态与 API；启动时自动打印 Local 与 Network 访问地址。

## 目录结构

```
HuiCloudOS/
├─ public/                # Vite 前端源码（Hash 路由）
│  ├─ index.html
│  ├─ styles.css
│  └─ src/
│     ├─ components/
│     ├─ context/
│     ├─ hooks/
│     ├─ modules/
│     ├─ pages/
│     ├─ utils/
│     └─ workers/
├─ src/                   # Node.js + Express 后端源码
│  ├─ server.js
│  └─ lib/
│     ├─ csv.js
│     ├─ store.js
│     ├─ upload.js
│     └─ utils.js
├─ scripts/dev.js         # 开发模式同时启动 Express 与 Vite
├─ vite.config.js
├─ package.json
└─ README.md
```

运行时会在 `src/data` 目录下生成以下持久化资源（均已写入 `.gitignore`）：

- `src/data/db.json`：主数据文件（视频 / 商品 / 订单 / 报价 / 设置 / 日志）。
- `src/data/videos/`：视频文件。
- `src/data/posters/`：首帧截图。
- `src/data/csv/`：CSV 导入副本。
- `src/data/chunks/`：上传分片临时目录。
- `exports/`：备份文件。

## 安装与启动

```bash
npm install
npm start
```

`npm start` 会执行以下步骤：

1. 构建前端（`vite build`，输出到 `dist/`）。
2. 启动 Express 服务（默认端口 `8080`）。
3. 服务启动后使用 `os.networkInterfaces()` 打印 Local / Network 访问地址。

开发模式可运行：

```bash
npm run dev
```

该命令通过 `scripts/dev.js` 并行启动 Express（8080）和 Vite Dev Server（5173，`--host`）。

## 可用脚本

| 命令         | 说明 |
|--------------|------|
| `npm run dev`   | 开发模式，Express + Vite 同时启动 |
| `npm run build` | 构建前端到 `dist/` |
| `npm start`     | 构建前端并启动 Express |

## 开发说明

- 视频上传采用原生分片机制，前端限制每个文件 ≤100MB，队列并发 4。后端在 `src/lib/upload.js` 内完成合并与校验。
- CSV 功能禁止第三方库，`public/src/workers/csvWorker.js` 与 `src/lib/csv.js` 分别负责前后端解析。
- PDF 导出通过浏览器 `window.print()` + `@media print`，不引入 PDF 库。
- 控制台内所有模块均为单页 Tab 切换，不增加路由数量。

## 登录信息

- 账号：`hxadmin`
- 密码：`hx84556793`

成功登录后可访问控制台标签页，执行视频管理、报价、订单等后台操作。

## 数据持久化

首次启动会自动初始化示例商品数据、系统设置等，所有数据保存在 `src/data/db.json` 中（原子写入）。为确保仓库不包含运行时资源，请勿将 `src/data`、`exports` 等目录提交至版本控制。

