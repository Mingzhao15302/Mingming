# HuiCloudOS v25.11.1

HuiCloudOS 是一个在浏览器中运行的多功能业务中台，提供视频库管理、商城、报价与订单管理等模块。本仓库包含 Express + SQLite 后端以及 React + Vite + Tailwind CSS 前端。

## 技术栈
- Node.js 20 LTS
- Express、Multer、better-sqlite3
- Vite、React 18、TypeScript、Tailwind CSS
- React Query、React Router
- pdf-lib、csv-parse、csv-stringify、PapaParse

## 安装与开发
```bash
npm install
npm start
```

`npm start` 会并行启动后端（默认端口 8080）与前端（默认端口 5173）。启动后终端会显示 Local 与 Network 访问地址。

## 目录结构
```
HuiCloudOS/
├─ server/         # Node/Express 后端
├─ web/            # React + Vite 前端
└─ exports/        # PDF / CSV 导出目录
```

更多信息请参考各目录 README 与注释。
