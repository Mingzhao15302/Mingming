# HuiCloud OS

HuiCloud OS 是一个浏览器端运行的多功能业务中台示例，结合 Node.js + Express 后端与 Vite + React 前端，覆盖登录、视频库管理、商城、订单报价等模块。

## 特性概览
- 🚀 **单一命令启动**：`npm start` 构建前端并启动 Express 服务，自动打印 Local 与 Network 访问地址。
- 💾 **本地持久化**：所有上传的视频、首帧图、CSV 文件以及结构化数据均存储在 `src/data` 目录下的独立子目录中。
- 📼 **大规模视频库**：服务端分页与前端懒加载结合，单个视频大小限制为 100MB，并提供批量上传、分类编辑、CSV 导入导出能力。
- 📊 **CSV 原生解析**：自研 `csv.js` 模块完成 CSV 读写，导出文件自动附带 UTF-8 BOM，兼容中文列名。
- 🧩 **控制台标签页**：控制台页面内包含视频库、报价、订单、商品、合同、导出、设置、维护八大标签，单页内完成业务切换。
- 🛒 **商城流程**：支持商城浏览、购物车、结算、下单成功页面及报价 PDF 打印视图。
- 🖥️ **响应式液态玻璃 UI**：统一的导航头部、半透明磨砂背景、卡片悬浮发光等视觉效果，适配桌面、平板与移动端。

## 项目结构
```
HuiCloudOS/
├─ public/
│  ├─ index.html          # 单页应用入口 (Hash Router)
│  └─ styles.css          # 全局原子化/玻璃态样式
├─ src/
│  ├─ server.js           # Express 服务与 API 定义
│  ├─ app.jsx             # React 入口
│  ├─ main.jsx            # Vite 挂载入口
│  ├─ components/         # UI 组件 (Header/Hero/VideoCard 等)
│  ├─ pages/              # 各路由页面
│  ├─ hooks/              # 自定义 Hook (数据获取、懒加载)
│  ├─ lib/
│  │  ├─ csv.js           # 原生 CSV 解析/生成
│  │  ├─ store.js         # 数据读写 + 文件锁
│  │  ├─ upload.js        # 上传与校验 (<=100MB)
│  │  └─ utils.js         # 网络地址打印、路径工具
│  ├─ data/
│  │  ├─ videos/          # 运行时写入，已在 .gitignore
│  │  ├─ posters/         # 运行时写入，已在 .gitignore
│  │  └─ csv/             # 运行时写入，已在 .gitignore
│  └─ routes/             # 按模块拆分的 API 路由
├─ .gitignore             # 忽略数据、导出、构建产物
├─ package.json
└─ README.md
```

> **注意**：`src/data/db.json`、`src/data/videos/`、`src/data/posters/`、`src/data/csv/` 均在 `.gitignore` 中，仅在运行时生成，不会被提交到版本库。

## 本地开发
```bash
npm install
npm run dev
```
`npm run dev` 会启动 Vite 开发服务器 (默认端口 5173，自动输出局域网地址)，用于浏览器实时调试前端界面。若需同时调试 API，可在另一个终端运行 `node src/server.js`（默认读取 `dist/`，开发阶段可通过设置 `NODE_ENV=development` 禁用静态托管）。

## 启动生产服务
```bash
npm start
```
该命令会先构建前端产物，然后启动 Express 服务：
- 静态托管 `dist/` 前端文件
- 提供 `/api/*` 接口（登录、视频、CSV、商城等）
- 自动打印 Local 与 Network 访问地址，便于局域网多端访问

## License
MIT
