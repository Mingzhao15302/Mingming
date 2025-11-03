# HuiCloud OS

HuiCloud OS 是一个运行在浏览器中的多功能业务中台，提供视频库管理、商城、报价/订单处理以及 CSV 导入导出等功能。项目采用 Express 后端与 React + Vite 前端，所有数据会持久化到本地 JSON 与文件夹。

## ✨ 功能概览
- 欢迎页、登录页、多标签控制台、商城购物流程等完整页面
- 视频库支持批量上传（单文件≤100MB）、懒加载浏览、首帧海报、分类编辑、CSV 导入导出
- Web Worker 解析 CSV，前端上传队列控制（并发 3 个）并展示进度
- 商城提供商品列表、详情、购物车、结算、订单成功页，支持报价/合同打印视图
- 控制台标签包括视频库、报价、订单、商品、合同模板、导出、设置、维护
- 后端将视频、海报、CSV 等写入 `src/data` 子目录，元数据存储于 `db.json`
- 启动时使用 `os.networkInterfaces()` 打印 Local 与 Network 访问地址

## 🛠️ 技术栈
- **后端**：Node.js + Express（单文件 `src/server.js`）
- **前端**：Vite + React + TypeScript + 原生 HTML/CSS
- **持久化**：本地 JSON 文件 + 文件系统
- **构建与开发**：`concurrently` 同时启动前后端

## 📁 目录结构
```
HuiCloudOS/
├─ public/              # 构建输出目录（Vite build）
├─ src/
│  ├─ server.js         # Express 服务，提供 REST API 与静态资源
│  ├─ lib/              # CSV、存储、上传、工具方法
│  └─ data/             # 运行时写入（videos/posters/csv/db.json）
├─ ui/                  # Vite + React 前端源代码
├─ package.json         # 根脚本：npm start / npm run dev / npm run build
└─ .gitignore           # 忽略运行期生成的二进制/数据文件
```

> 注意：`src/data/db.json`、`videos/`、`posters/`、`csv/` 等运行时生成目录不会提交到 Git。

## 🚀 本地运行
```bash
npm install          # 安装根依赖，会自动执行 ui/ 内的依赖安装
npm start            # 构建前端并启动 Express（默认 8080）
```

启动后 Express 会托管打包后的前端页面，浏览器访问 `http://localhost:8080` 即可看到完整应用；终端会显示类似信息：
```
HuiCloud OS API 已启动，端口 8080
HuiCloud OS 服务地址:
  • http://localhost:8080
  • http://192.168.x.x:8080
```

开发阶段如需热更新，可使用：

```bash
npm run dev          # 并行启动 nodemon(8080) 与 Vite(5173)
```

此时可以在 `http://localhost:5173` 访问 Vite Dev Server，所有 `/api` 请求会自动代理到 8080。

## 📦 构建
```bash
npm run build        # 构建前端到 public/ 目录
npm run server       # 启动仅后端服务（可用于部署）
```

## 📝 约束与说明
- 禁止提交任何二进制多媒体文件，视频/海报/CSV 会在运行时上传到 `src/data`
- CSV 导出默认包含 UTF-8 BOM (`\uFEFF`)
- PDF 导出通过浏览器 `window.print()` 完成，不引入第三方 PDF 库
- 所有上传文件大小限制为 100 MB，超限会被拒绝

如需初始化默认数据，可运行应用后通过控制台界面导入 CSV 或手动上传视频。
