# 辉云易达 OS

本项目是一个基于 Node.js + Express 的本地视频管理系统，提供登录、视频批量导入、CSV 导入导出、分类编辑与前端多端自适应浏览体验，便于在局域网内部署并通过浏览器访问。

## 功能特性

- 🔐 **登录控制**：默认账号 `hxadmin`，密码 `hx84556793`，支持 localStorage 持久化状态。
- 📁 **批量视频导入**：通过控制台一次上传多个视频文件，自动写入 `data/videos.json` 并存放于 `/videos` 目录。
- 📄 **CSV 导入导出**：支持分类信息批量导入与导出，列名可使用中文标签或字段 key。
- 🏷️ **视频分类管理**：内置灌装、码垛等多维分类字段，可在弹窗中编辑并持久保存。
- 🔍 **筛选预览**：前台页面按多条件筛选展示视频卡片，支持播放/暂停与全屏。
- 📱 **响应式设计**：采用 CSS Grid + 媒体查询，实现桌面/平板/手机自适应布局。
- ✨ **液态玻璃 UI**：统一的半透明毛玻璃风格、柔光渐变与按钮光晕动画。

## 项目结构

```
huixin-vision-os/
├─ package.json
├─ server.js
├─ README.md
├─ config/
│  └─ categoryFields.json
├─ data/
│  └─ videos.json
├─ public/
│  ├─ index.html
│  ├─ login.html
│  ├─ dashboard.html
│  ├─ css/
│  │  ├─ base.css
│  │  ├─ dashboard.css
│  │  ├─ login.css
│  │  └─ style.css
│  ├─ js/
│  │  ├─ dashboard.js
│  │  ├─ login.js
│  │  └─ main.js
│  ├─ assets/
│  │  └─ icons/
│  └─ videos/
└─ videos/
```

> `public/videos` 用于静态资源目录映射，`/videos`（项目根）用于实际文件存储，默认提供空目录，上传时会自动填充。

## 快速开始

1. 安装依赖：

   ```bash
   npm install
   ```

2. 启动服务：

   ```bash
   npm start
   ```

   服务启动后控制台会输出本地（localhost）与局域网访问地址。

3. 浏览器访问：
   - 视频浏览页：`http://localhost:3000/`
   - 登录页：`http://localhost:3000/login`
   - 控制台：`http://localhost:3000/dashboard`

## 控制台操作指南

- **批量导入视频**：点击“批量导入视频”选择多个文件，上传后会自动记录标题（文件名）和初始分类。
- **导入 CSV**：准备包含 `fileName` 或 `title` 列的 CSV 文件，可附带任意分类字段（中文标签或 key），系统会按文件名匹配并更新分类。
- **导出 CSV**：生成当前视频数据的完整 CSV 文件。
- **编辑分类**：点击表格中的“编辑”打开毛玻璃弹窗，调整各项分类后保存。
- **退出登录**：点击“退出登录”清除本地登录状态。

## CSV 格式说明

- 最少需要 `fileName`（或 `filename` / `title`）列用于匹配视频。
- 分类列可使用中文名称（如“产品类型”）或字段 key（如 `productType`）。
- 多选字段的值使用英文逗号、分号或换行分隔（例如 `自动开箱;自动装箱`）。

## 其他说明

- 所有上传的视频文件会保存在项目根目录下的 `/videos` 文件夹。
- 系统默认为分类字段提供“空白”选项，便于保持字段可选可空。
- UI 采用淡入淡出、光晕按钮与毛玻璃背景，如需定制样式，可在 `public/css` 目录中修改。

祝使用愉快！
