# HuiCloud OS

HuiCloud OS 是一个基于浏览器的多功能业务中台，提供视频库管理、商城、报价、订单与维护模块。项目使用 Node.js + Express 构建后端，前端基于 Vite + React，所有运行期产生的文件均存储在本地文件夹并长期保留。

## 功能总览
- 登录认证后访问控制台，多标签管理视频、报价、订单、商品、合同、导出、设置与维护
- 视频库支持批量上传、分类编辑、懒加载预览、CSV 导入导出、首帧图生成上传、下载
- 商城包含首页、详情、购物车、结算与下单成功流程
- 视频浏览页提供多维筛选、关键字搜索、响应式卡片、IntersectionObserver 懒加载
- 报价系统支持模板卡片、表单计算、优惠策略、打印视图导出 PDF
- CSV 操作基于原生解析/序列化，支持 Web Worker、UTF-8 with BOM
- 上传队列控制（并发 3~5）、状态可视化、失败重试

## 技术栈
- 后端：Node.js 20 + Express 4
- 前端：Vite 5 + React 18 + 原生 HTML/CSS/JS
- 文件存储：本地 `data/` 目录中的 `videos/`、`posters/`、`csv/`、`logs/`

## 开发与运行
```bash
npm install
npm start
```

`npm start` 会启动 Express 应用并在开发模式下挂载 Vite 中间件，终端会自动打印 Local 与 Network 访问地址（例如 `http://localhost:5173` 与 `http://192.168.x.x:5173`）。

### 构建
```bash
npm run build
```

构建后会生成 `dist/`，生产模式下服务器将直接提供静态资源。

## 目录结构
```
HuiCloudOS/
├─ public/             # 静态公共资源（背景、占位符等纯文本）
├─ src/
│  ├─ server.js        # Express 入口，整合 API 与 Vite
│  ├─ lib/             # CSV、存储、上传、工具模块
│  └─ frontend/        # React 组件、页面、hooks、上下文
├─ data/               # 运行期生成：db.json、videos/、posters/、csv/
├─ dist/               # 构建输出（忽略）
├─ package.json
└─ README.md
```

## Git 忽略
仓库忽略所有运行期产生的二进制文件，包括 `data/` 内的 `*.mp4`、`*.jpg`、`*.pdf` 等，确保版本库保持纯文本。

## 许可证
MIT
