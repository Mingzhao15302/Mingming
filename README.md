# 辉云易达 OS

辉云易达 OS 是一个基于 Node.js + Express 的本地视频管理系统，提供登录验证、批量导入、CSV 导入导出以及自适应的视频浏览体验。

## 功能特性

- 🔐 **登录控制**：默认账号 `hxadmin` / 密码 `hx84556793`，登录状态存储于浏览器 `localStorage`。
- 📥 **批量导入视频**：支持多选视频上传，自动存储至项目根目录 `videos/` 并写入 `data/videos.json`。
- 📄 **CSV 导入导出**：一键导入分类信息，快速导出当前视频配置。
- 🧭 **分类管理**：控制台可编辑单个视频的分类、功能模块、桶型、标签信息。
- 🎞️ **自适应浏览**：首页采用响应式栅格布局，电脑 / 平板 / 手机自动适配。
- 🪟 **液态玻璃风格**：全局半透明、毛玻璃、渐变光影效果，搭配按钮悬停动画与页面淡入过渡。

## 目录结构

```
huixin-vision-os/
├─ package.json
├─ server.js
├─ README.md
├─ data/
│  └─ videos.json
├─ public/
│  ├─ index.html
│  ├─ login.html
│  ├─ dashboard.html
│  ├─ css/
│  │  ├─ style.css
│  │  ├─ dashboard.css
│  │  └─ login.css
│  ├─ js/
│  │  ├─ main.js
│  │  ├─ dashboard.js
│  │  └─ login.js
│  └─ assets/
│     └─ icons/
└─ videos/
```

> 说明：`videos/` 为上传视频存放目录，初始为空；`assets/icons/` 可放置后续扩展使用的图标资源。

## 安装与启动

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动服务**

   ```bash
   npm start
   ```

   启动后终端会输出 Local 与 Network 两种访问地址，确保同一局域网内的设备可以通过 Network 地址访问。

3. **访问入口**
   - 登录页：`http://localhost:3000/login.html`
   - 控制台：`http://localhost:3000/dashboard.html`（需先登录）
   - 视频浏览页：`http://localhost:3000/`

## 使用说明

1. 打开登录页，使用默认账号密码登录。
2. 在控制台批量上传视频或导入 CSV，系统会自动更新 `data/videos.json`。
3. 点击“编辑”可修改单个视频的分类信息并保存。
4. 使用“导出 CSV”下载当前数据，便于备份或共享。
5. 在首页 `index.html` 根据分类、功能模块、桶型、标签进行筛选，点击卡片中的按钮即可播放或全屏预览。

## CSV 模板

CSV 文件需包含表头（列名大小写不敏感）：

```
filename,category,module,bucket,tags
``` 

- `filename`：视频文件原始名称或服务器存储名称。
- 其他字段可根据需要填写，可使用空格或逗号分隔多个标签。

## 开发提示

- 服务器默认端口为 `3000`，可通过环境变量 `PORT` 修改。
- 上传文件体积受服务器及浏览器限制，建议控制在 200MB 内。
- 若手动修改 `data/videos.json`，请确保 JSON 格式正确。

欢迎根据业务需求扩展更多智能标签、搜索或权限功能。祝您使用愉快！
