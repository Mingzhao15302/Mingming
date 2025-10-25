# 辉云易达 OS

一个基于 Node.js + Express 的本地视频管理系统，提供登录控制、视频上传、CSV 批量导入导出、分类管理和多终端自适应视频浏览。

## 功能特性

- ✅ 登录认证（默认账号：`hxadmin`，密码：`hx84556793`）
- ✅ 批量上传视频到本地 `/public/videos` 目录并生成数据记录
- ✅ CSV 批量导入 / 导出视频分类信息
- ✅ 丰富的分类字段编辑与持久化存储（`data/videos.json`）
- ✅ 响应式液态玻璃风格 UI，兼容电脑 / 平板 / 手机
- ✅ 前台根据分类筛选、播放、全屏预览视频

## 项目结构

```
huixin-vision-os/
├── package.json
├── server.js
├── README.md
├── data/
│   └── videos.json
└── public/
    ├── index.html
    ├── login.html
    ├── dashboard.html
    ├── css/
    │   ├── style.css
    │   ├── login.css
    │   ├── dashboard.css
    │   └── style-base.css
    ├── js/
    │   ├── main.js
    │   ├── login.js
    │   └── dashboard.js
    ├── assets/
    │   └── icons/
    └── videos/
```

## 本地运行

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动服务

   ```bash
   npm start
   ```

   启动成功后，终端会输出 Local 与 Network 的访问地址，可在同一局域网中通过手机 / 平板访问。

3. 浏览器访问

   - 视频浏览页：`http://localhost:3000/`
   - 登录页：`http://localhost:3000/login`
   - 控制台：`http://localhost:3000/dashboard`

## CSV 字段说明

导入导出 CSV 时支持以下字段（表头需与字段名一致）：

- `fileName`（或 `displayName`）用于匹配视频记录
- 分类字段：`productType`、`fillingMachine`、`fillingLine`、`capType`、`capacity`、`materialIn`、`explosionProof`、`fillingHeads`、`capping`、`conveyor`、`buffer`、`voc`、`bucketSeparation`
- 支持多选的字段使用顿号 / 逗号 / 分号分隔：`weighing`、`labeling`、`palletHandling`、`boxing`、`extraFeatures`

## 数据存储

- 视频文件保存在 `public/videos/` 目录
- 视频元数据与分类信息保存在 `data/videos.json`

## 注意事项

- 请确保运行环境已安装 Node.js 16+ 及 npm
- 视频上传会使用原文件名前增加时间戳的方式生成唯一文件名
- 若需要清空数据，可删除 `data/videos.json` 中的内容并移除对应视频文件
