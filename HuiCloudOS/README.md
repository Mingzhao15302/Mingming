# 辉云易达 OS（HuiCloud OS）

辉云易达 OS 是一个运行在浏览器中的多功能业务中台，采用 **Node.js 原生模块** 构建后端，与 **Vite + 原生 HTML/CSS/JS** 构建前端。系统覆盖欢迎页、登录、控制台、视频库、商城与订单流程等模块，支持海量视频管理、CSV 导入导出、报价单/合同打印视图等业务场景。

## ✨ 功能亮点
- 全站单页多入口（Hash 路由），覆盖欢迎页、登录、商城、视频浏览、购物车、结算、下单成功与控制台多标签
- 视频库支持批量上传（分片直传，单文件 ≤ 100MB）、分类筛选、服务端分页、前端懒加载与首帧图采集
- CSV 支持 Web Worker 并行解析、Promise 池控制并发导入、UTF-8 with BOM 导出
- 报价系统提供模板配置、优惠计算、打印视图（浏览器 `window.print()` 导出 PDF）
- 控制台提供视频库、报价、订单、商品、合同模板、导出、设置、维护等标签页，数据实时刷新
- 永久化存储基于本地文件系统，视频、首帧图、CSV、数据索引均落地至约定目录

## 🧱 目录结构
```
HuiCloudOS/
├─ web/
│  ├─ index.html             # 单入口，Hash 路由控制多页面视图
│  ├─ main.js                # 原生 JS 应用逻辑，欢迎页通过 CDN ESM 引入 Vue 3 动效
│  ├─ styles.css             # 全局玻璃拟态风格样式
│  ├─ workers/
│  │  └─ csvWorker.js        # Web Worker CSV 解析器
│  └─ public/
│     ├─ assets/
│     │  ├─ logos/           # LOGO（运行时放置 huixin-logo.png）
│     │  └─ backgrounds/     # 欢迎页背景图 home-hero.jpg
│     ├─ products/           # 产品卡片与轮播图目录（运行时放置）
│     ├─ videos/             # 视频文件存储（运行时写入）
│     └─ posters/            # 视频首帧图（运行时写入）
├─ server/
│  ├─ server.js              # Node 原生 http 服务，提供 REST API 与静态资源
│  └─ lib/
│     ├─ csv.js              # CSV 读写与格式化
│     ├─ store.js            # JSON 数据仓库与初始化
│     ├─ upload.js           # 分片上传写入与合并
│     └─ utils.js            # 常用工具函数（响应封装、ID 生成等）
├─ scripts/
│  └─ dev.js                 # npm start：child_process 同启 Vite(--host) 与后端
├─ package.json              # 根脚本
└─ .gitignore                # 忽略运行时生成的二进制/数据文件
```

> **重要提示**：仓库不包含任何二进制媒体文件。请在 `web/public/assets/logos/` 与 `web/public/assets/backgrounds/` 中放入必需的 LOGO 与背景图；视频、首帧图、产品图等运行时写入的文件已在 `.gitignore` 中排除。

## 🚀 快速开始
```bash
npm install
npm start
```

`npm start` 将并行启动：
- Vite 开发服务器（`vite --host`），输出 Local 与 Network 访问地址
- Node 原生后端（`server/server.js`），启动时通过 `os.networkInterfaces()` 打印 API Local/Network 地址

访问 `http://localhost:5173/#/welcome` 可进入欢迎页。

### 账号信息
- 账号：`hxadmin`
- 密码：`hx84556793`

登录后可进入控制台进行视频上传、分类、CSV 导出等操作。登录凭证将储存在 `sessionStorage`，后端使用简单 token 校验。

## 📦 构建
```bash
npm run build
```

前端构建产物输出至 `web/dist/`。生产部署时可通过任意静态服务器托管 `web/dist` 并使用 `node server/server.js` 启动后端。

## 📁 数据与上传目录
- `web/public/videos/`：视频文件（运行时生成，单文件 ≤ 100 MB）
- `web/public/posters/`：视频首帧 JPG（运行时生成）
- `server/data/`：索引/临时文件夹（`uploads/`、`csv/`、`exports/`、`db.json` 等）

运行时若目录不存在，后端会自动创建。批量导入 CSV、分片上传视频均支持断点续传与失败重试。

## 🧪 测试数据
首次运行若 `server/data/db.json` 不存在，后端会自动生成 2,000 条示例视频记录、若干产品样例与默认分类，用于演示大规模数据分页与筛选。示例条目引用 `web/public/videos/sample.mp4` 与 `web/public/posters/sample.jpg`，请在实际部署时替换为真实素材。

## 📄 许可证
MIT
