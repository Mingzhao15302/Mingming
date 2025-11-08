# 辉云易达 OS

辉云易达 OS（HuiCloud OS）是一个轻量级本地业务中台，包含视频库、商城、控制台等模块。项目基于 Node.js + Express 后端与 Vite + React + TailwindCSS 前端构建，采用 JSON 与 CSV 作为主要数据存储格式，可在本地通过 `npm start` 一键启动前后端。

## 快速开始

```bash
npm install
npm start
```

启动后将同时运行：
- API 服务：默认端口 4000，控制台会输出 Local 与 Network 访问地址。
- 前端：默认端口 5173，Vite 会输出本机与局域网访问链接。

## 目录结构

```
server/         # Node.js + Express 后端
web/            # Vite + React + TailwindCSS 前端
data/           # 视频、首帧、CSV 与导出文件目录（启动时自动创建）
```

## 主要特性
- 视频卡片即播放器，支持懒加载与首帧截图上传。
- CSV 解析使用原生 Web Worker，导出采用 UTF-8 with BOM。
- 控制台提供多标签页管理视频、订单、商品、合同与设置。
- 无需原生编译依赖，所有数据以 JSON / CSV 持久化在本地。

## 约束说明
- 项目不会自动生成示例图片、视频或 PDF，仅创建空目录与 `.gitkeep` 文件。
- 单个视频上传大小限制为 100MB，并在前后端双重校验。
